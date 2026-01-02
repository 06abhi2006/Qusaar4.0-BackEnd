import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { authenticate, requireRole } from '../middleware/auth';
import { StatsService } from '../services/stats.service';
import { DoctorService } from '../services/doctor.service';
import { AuthService } from '../services/auth.service';
import { PatientService } from '../services/patient.service';
import { AuditService } from '../middleware/audit';
import { validators, validate } from '../middleware/validation';
import { PrismaClient, Prisma } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient(); // Initialize Prisma

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireRole('admin'));

/**
 * GET /api/admin/stats
 * Get hospital statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await StatsService.getHospitalStats();

    // Audit log
    await AuditService.log(
      req.user!.id,
      AuditService.ACTIONS.VIEW_STATS
    );

    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/admin/doctors
 * Get all doctors
 */
router.get('/doctors', async (_req: Request, res: Response) => {
  try {
    const doctors = await DoctorService.getAllDoctors();

    // Transform to match frontend format
    const formatted = doctors.map((doctor: any) => ({
      id: doctor.id,
      name: doctor.user.name,
      email: doctor.user.email,
      specialization: doctor.specialization,
      department: doctor.department ? doctor.department.name : '', // Handle relation
      phone: doctor.phone,
      available: doctor.available,
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch doctors' });
  }
});

/**
 * POST /api/admin/doctors
 * Create a new doctor
 */
router.post(
  '/doctors',
  validate([
    validators.name,
    validators.email,
    validators.password,
    body('specialization').trim().notEmpty().withMessage('Specialization is required'),
    body('department').trim().notEmpty().withMessage('Department is required'),
    validators.phone,
  ]),
  async (req: Request, res: Response) => {
    try {
      const { name, email, password, specialization, department, phone } = req.body;

      const doctor = await DoctorService.createDoctor(
        { name, email, password, specialization, department, phone },
        req.user!.id
      );

      // Transform to match frontend format
      const formatted = {
        id: doctor.id,
        name: doctor.user.name,
        email: doctor.user.email,
        specialization: doctor.specialization,
        department: doctor.department ? doctor.department.name : '',
        phone: doctor.phone,
        available: doctor.available,
      };

      res.status(201).json(formatted);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to create doctor' });
    }
  }
);

/**
 * PUT /api/admin/doctors/:id
 * Update doctor information
 */
router.put(
  '/doctors/:id',
  validate([
    validators.uuid,
    validators.name.optional(),
    validators.email.optional(),
    body('specialization').optional().trim().notEmpty(),
    body('department').optional().trim().notEmpty(),
    validators.phone.optional(),
  ]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData: any = {};

      if (req.body.name) updateData.name = req.body.name;
      if (req.body.email) updateData.email = req.body.email;
      if (req.body.specialization) updateData.specialization = req.body.specialization;
      if (req.body.department) updateData.department = req.body.department;
      if (req.body.phone) updateData.phone = req.body.phone;

      const doctor = await DoctorService.updateDoctor(id, updateData, req.user!.id);

      // Transform to match frontend format
      const formatted = {
        id: doctor.id,
        name: doctor.user.name,
        email: doctor.user.email,
        specialization: doctor.specialization,
        department: doctor.department ? doctor.department.name : '',
        phone: doctor.phone,
        available: doctor.available,
      };

      res.json(formatted);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to update doctor' });
    }
  }
);

/**
 * GET /api/admin/receptionists
 * Get all receptionists
 */
router.get('/receptionists', async (_req: Request, res: Response) => {
  try {
    const receptionists = await prisma.receptionist.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = receptionists.map((r) => ({
      id: r.id, // Receptionist ID
      userId: r.userId,
      name: r.user.name,
      email: r.user.email,
      status: r.user.status,
      isActive: r.isActive,
      shiftType: r.shiftType,
      workStartTime: r.workStartTime,
      workEndTime: r.workEndTime,
    }));

    return res.json(formatted);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Failed to fetch receptionists' });
  }
});

/**
 * POST /api/admin/receptionists
 * Create a new receptionist with details
 */
router.post(
  '/receptionists',
  validate([
    validators.name,
    validators.email,
    validators.password,
    validators.phone, // We don't save phone in Schema for User/Receptionist yet, but I'll validator it.
    body('shiftType').isIn(['DAY', 'NIGHT']).withMessage('Invalid shift type (DAY/NIGHT)'),
    body('workStartTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time (HH:mm)'),
    body('workEndTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time (HH:mm)'),
  ]),
  async (req: Request, res: Response) => {
    try {
      const { name, email, password, shiftType, workStartTime, workEndTime } = req.body;

      // Use AuthService to handle password hashing
      const hashedPassword = await AuthService.hashPassword(password);

      const result = await prisma.$transaction(async (tx) => {
        // 1. Create User
        const user = await tx.user.create({
          data: {
            name,
            email,
            passwordHash: hashedPassword,
            role: 'receptionist',
            status: 'active',
          },
        });

        // 2. Create Receptionist Profile
        const receptionist = await tx.receptionist.create({
          data: {
            userId: user.id,
            shiftType,
            workStartTime,
            workEndTime,
            isActive: true,
          },
        });

        return { user, receptionist };
      });

      return res.status(201).json({
        id: result.receptionist.id,
        userId: result.user.id,
        name: result.user.name,
        email: result.user.email,
        shiftType: result.receptionist.shiftType,
      });
    } catch (error: any) {
      if (error.code === 'P2002') { // Unique constraint
        return res.status(400).json({ message: 'Email already exists' });
      }
      return res.status(400).json({ message: error.message || 'Failed to create receptionist' });
    }
  }
);

/**
 * DELETE /api/admin/receptionists/:id
 * Soft delete a receptionist
 */
router.delete(
  '/receptionists/:id',
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await prisma.$transaction(async (tx) => {
        // Find receptionist to get UserId
        const receptionist = await tx.receptionist.findUnique({
          where: { id },
          include: { user: true }
        });

        if (!receptionist) {
          throw new Error('Receptionist not found');
        }

        // Deactivate Receptionist
        await tx.receptionist.update({
          where: { id },
          data: { isActive: false },
        });

        // Deactivate User
        await tx.user.update({
          where: { id: receptionist.userId },
          data: { status: 'inactive' },
        });
      });

      return res.json({ message: 'Receptionist deactivated successfully' });
    } catch (error: any) {
      if (error.message === 'Receptionist not found') {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message || 'Failed to remove receptionist' });
    }
  }
);

/**
 * POST /api/admin/patients
 * Create a new patient
 */
router.post(
  '/patients',
  validate([
    validators.name,
    validators.email,
    validators.password,
    validators.age,
    validators.gender,
    validators.phone,
    body('address').optional().trim(),
  ]),
  async (req: Request, res: Response) => {
    try {
      const { name, email, password, age, gender, phone, address } = req.body;

      // Use PatientService to create user and patient profile
      const patient = await PatientService.createPatient(
        {
          name,
          email,
          password,
          age: parseInt(age),
          gender,
          phone,
          address,
        },
        req.user!.id
      );

      res.status(201).json(patient);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to create patient' });
    }
  }
);

/**
 * PATCH /api/admin/doctors/:id/availability
 * Toggle doctor availability
 */
router.patch(
  '/doctors/:id/availability',
  validate([
    validators.uuid,
    body('available').isBoolean().withMessage('Available must be a boolean'),
  ]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { available } = req.body;

      const doctor = await DoctorService.toggleAvailability(id, available, req.user!.id);

      // Transform to match frontend format
      const formatted = {
        id: doctor.id,
        name: doctor.user.name,
        email: doctor.user.email,
        specialization: doctor.specialization,
        department: doctor.department ? doctor.department.name : '',
        phone: doctor.phone,
        available: doctor.available,
      };

      res.json(formatted);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to update availability' });
    }
  }
);

// ... existing code ...

/**
 * GET /api/admin/cashiers
 * Get all cashiers
 */
router.get('/cashiers', async (_req: Request, res: Response) => {
  try {
    type UserWithCashier = Prisma.UserGetPayload<{
      include: { cashier: true }
    }>;

    const cashiers = await prisma.user.findMany({
      where: {
        role: 'cashier',
        status: 'active',
      },
      include: {
        cashier: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }) as UserWithCashier[];

    const formattedWaiters = cashiers.map((u) => ({
      id: u.cashier?.id,
      userId: u.id,
      name: u.name,
      email: u.email,
      shiftType: u.cashier?.shiftType,
      workStartTime: u.cashier?.workStartTime,
      workEndTime: u.cashier?.workEndTime,
      isActive: u.cashier?.isActive,
    })).filter((c): c is NonNullable<typeof c> => !!c.id);

    return res.json(formattedWaiters);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Failed to fetch cashiers' });
  }
});

/**
 * POST /api/admin/cashiers
 * Create a new cashier
 */
router.post(
  '/cashiers',
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars'),
    body('shiftType').isIn(['DAY', 'NIGHT']).withMessage('Invalid shift type'),
    body('workStartTime').notEmpty().withMessage('Start time required'),
    body('workEndTime').notEmpty().withMessage('End time required'),
  ]),
  async (req: Request, res: Response) => {
    try {
      const { name, email, password, shiftType, workStartTime, workEndTime } = req.body;

      // Check existing email
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const passwordHash = await AuthService.hashPassword(password);

      const result = await prisma.$transaction(async (tx) => {
        // Create User
        const user = await tx.user.create({
          data: {
            name,
            email,
            passwordHash,
            role: 'cashier',
            status: 'active',
          },
        });

        // Create Cashier Profile
        const cashier = await tx.cashier.create({
          data: {
            userId: user.id,
            shiftType,
            workStartTime,
            workEndTime,
          },
        });

        return { user, cashier };
      });

      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Failed to create cashier' });
    }
  }
);

/**
 * DELETE /api/admin/cashiers/:id
 * Soft delete cashier
 */
router.delete('/cashiers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      const cashier = await tx.cashier.findUnique({ where: { id } });
      if (!cashier) {
        throw new Error('Cashier not found');
      }

      await tx.cashier.update({
        where: { id },
        data: { isActive: false },
      });

      await tx.user.update({
        where: { id: cashier.userId },
        data: { status: 'inactive' },
      });
    });

    return res.json({ message: 'Cashier removed successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Failed to remove cashier' });
  }
});

export default router;

