import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { authenticate, requireRole } from '../middleware/auth';
import { PatientService } from '../services/patient.service';
import { DoctorService } from '../services/doctor.service';
import { AppointmentService } from '../services/appointment.service';
import { validators, validate } from '../middleware/validation';
import { Prisma } from '@prisma/client';

const router = Router();

// All receptionist routes require authentication and receptionist role
router.use(authenticate);
router.use(requireRole('receptionist'));

/**
 * GET /api/receptionist/patients
 * Get all patients
 */
router.get('/patients', async (_req: Request, res: Response) => {
  try {
    const patients = await PatientService.getAllPatients();

    // Transform to match frontend format
    const formatted = patients.map((patient) => ({
      id: patient.id,
      name: patient.user.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.user.email,
      address: patient.address || '',
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies,
      createdAt: patient.createdAt.toISOString(),
    }));

    return res.json(formatted);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Failed to fetch patients' });
  }
});

/**
 * POST /api/receptionist/patients
 * Register a new patient
 */
router.post(
  '/patients',
  validate([
    validators.name,
    validators.email,
    // validators.password, // Password is optional for receptionist registration (auto-generated)
    validators.age,
    validators.gender,
    validators.phone,
    body('address').trim().notEmpty().withMessage('Address is required'),
    body('bloodGroup').optional().trim(),
    body('allergies').optional().trim(),
    body('emergencyContact').optional().trim(),
  ]),
  async (req: Request, res: Response) => {
    try {
      const {
        name,
        email,
        password,
        age,
        gender,
        phone,
        address,
        bloodGroup,
        allergies,
        emergencyContact,
      } = req.body;

      // Default password if not provided (e.g., from quick register)
      const finalPassword = password || 'Hospital@123';

      const patient = await PatientService.createPatient(
        {
          name,
          email,
          password: finalPassword,
          age: parseInt(age),
          gender,
          phone,
          address,
          bloodGroup,
          allergies,
          emergencyContact,
        },
        req.user!.id
      );

      // Transform to match frontend format
      const formatted = {
        id: patient.id,
        name: patient.user.name,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.user.email,
        address: patient.address || '',
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies,
        createdAt: patient.createdAt.toISOString(),
      };

      return res.status(201).json(formatted);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Failed to register patient' });
    }
  }
);

/**
 * GET /api/receptionist/doctors
 * Get available doctors
 */
router.get('/doctors', async (_req: Request, res: Response) => {
  try {
    const doctors = await DoctorService.getAllDoctors(true); // availableOnly = true

    // Transform to match frontend format
    const formatted = doctors.map((doctor) => ({
      id: doctor.id,
      name: doctor.user.name,
      email: doctor.user.email,
      specialization: doctor.specialization,
      department: doctor.department,
      phone: doctor.phone,
      available: doctor.available,
    }));

    return res.json(formatted);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Failed to fetch doctors' });
  }
});

/**
 * POST /api/receptionist/appointments
 * Schedule a new appointment
 */
router.post(
  '/appointments',
  validate([
    body('patientId').isUUID().withMessage('Invalid patient ID'),
    body('doctorId').isUUID().withMessage('Invalid doctor ID'),
    body('date').isISO8601().withMessage('Invalid date format'),
    body('time').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
    body('reason').trim().notEmpty().withMessage('Reason is required'),
  ]),
  async (req: Request, res: Response) => {
    try {
      const { patientId, doctorId, date, time, reason } = req.body;

      // Combine date and time into a single DateTime
      const scheduledTime = new Date(`${date}T${time}`);

      // Validate that the appointment is in the future
      if (scheduledTime < new Date()) {
        return res.status(400).json({ message: 'Appointment must be scheduled in the future' });
      }

      const appointment = await AppointmentService.createAppointment(
        {
          patientId,
          doctorId,
          scheduledTime,
          reason,
        },
        req.user!.id
      );

      // Explicit typing for appointment result
      type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
        include: {
          patient: { include: { user: true } };
          doctor: { include: { user: true } };
        };
      }>;

      const appointmentWithRelations = appointment as AppointmentWithRelations;

      // Transform to match frontend format
      const formatted = {
        id: appointmentWithRelations.id,
        patientId: appointmentWithRelations.patientId,
        patientName: appointmentWithRelations.patient.user.name,
        doctorId: appointmentWithRelations.doctorId,
        doctorName: appointmentWithRelations.doctor.user.name,
        date: appointmentWithRelations.scheduledTime.toISOString().split('T')[0],
        time: appointmentWithRelations.scheduledTime.toTimeString().slice(0, 5),
        status: appointmentWithRelations.status,
        reason: appointmentWithRelations.reason,
      };

      return res.status(201).json(formatted);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Failed to schedule appointment' });
    }
  }
);

export default router;

