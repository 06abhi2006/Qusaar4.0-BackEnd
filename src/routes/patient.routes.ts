import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { AppointmentService } from '../services/appointment.service';
import { MedicalRecordService } from '../services/medicalRecord.service';
import { DoctorAllocationService } from '../services/doctor_allocation.service';
import { validate } from '../middleware/validation';
import { body } from 'express-validator';
import { PrismaClient, Prisma } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// All patient routes require authentication and patient role
router.use(authenticate);
router.use(requireRole('patient'));

/**
 * POST /api/patient/appointments
 * Request a new appointment
 */
router.post(
  '/appointments',
  validate([
    body('problemDescription').trim().notEmpty().withMessage('Problem description is required'),
    body('urgency').optional().isIn(['NORMAL', 'HIGH']).withMessage('Invalid urgency level'),
    body('preferredDate').optional().isISO8601().toDate().withMessage('Invalid date format'),
  ]),
  async (req: Request, res: Response) => {
    try {
      const { problemDescription, urgency = 'NORMAL', preferredDate } = req.body;
      const patientId = req.user!.id; // Authenticated user ID

      // 1. Get Patient Profile
      const patient = await prisma.patient.findUnique({
        where: { userId: patientId },
      });

      if (!patient) {
        return res.status(404).json({ message: 'Patient profile not found' });
      }

      // 2. Allocate Doctor
      const doctor = await DoctorAllocationService.allocateDoctor(problemDescription);

      if (!doctor) {
        return res.status(404).json({ message: 'No suitable doctor found at the moment' });
      }

      // 3. Find Next Available Slot
      // Pass preferredDate if provided, otherwise default logic applies
      const scheduledTime = await DoctorAllocationService.findNextAvailableSlot(
        doctor.id,
        preferredDate
      );

      // 4. Create Appointment
      const appointment = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          scheduledTime,
          status: 'CONFIRMED', // Auto-confirming as per request "Save confirmed appointment"
          reason: problemDescription,
          urgency: urgency,
        },
        include: {
          doctor: {
            include: { user: true }
          }
        }
      });

      // Explicitly type the result to include the doctor relation
      type AppointmentWithDoctor = Prisma.AppointmentGetPayload<{
        include: {
          doctor: {
            include: { user: true }
          }
        }
      }>;

      const appointmentWithDoctor = appointment as AppointmentWithDoctor;

      return res.status(201).json({
        message: 'Appointment scheduled successfully',
        appointment: {
          id: appointmentWithDoctor.id,
          doctorName: appointmentWithDoctor.doctor.user.name,
          specialization: appointmentWithDoctor.doctor.specialization,
          scheduledTime: appointmentWithDoctor.scheduledTime,
          status: appointmentWithDoctor.status
        }
      });

    } catch (error: any) {
      console.error('Appointment booking failed:', error);
      return res.status(500).json({ message: error.message || 'Failed to book appointment' });
    }
  }
);

/**
 * GET /api/patient/appointments
 * Get all appointments for the logged-in patient
 */
router.get('/appointments', async (req: Request, res: Response) => {
  try {
    // Get patient ID from user
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user!.id },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const appointments = await AppointmentService.getPatientAppointments(patient.id);

    // Transform to match frontend format
    const formatted = appointments.map((appointment) => ({
      id: appointment.id,
      patientId: appointment.patientId,
      patientName: 'You', // Patient viewing their own appointments
      doctorId: appointment.doctorId,
      doctorName: appointment.doctor.user.name,
      date: appointment.scheduledTime.toISOString().split('T')[0],
      time: appointment.scheduledTime.toTimeString().slice(0, 5),
      status: appointment.status,
      reason: appointment.reason,
    }));

    return res.json(formatted);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Failed to fetch appointments' });
  }
});

/**
 * GET /api/patient/medical-records
 * Get all medical records for the logged-in patient
 */
router.get('/medical-records', async (req: Request, res: Response) => {
  try {
    // Get patient ID from user
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user!.id },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const records = await MedicalRecordService.getPatientMedicalRecords(
      patient.id,
      req.user!.id,
      req.user!.role
    );

    // Transform to match frontend format
    const formatted = records.map((record) => ({
      id: record.id,
      patientId: record.patientId,
      doctorId: record.doctorId,
      doctorName: record.doctor.user.name,
      date: record.createdAt.toISOString().split('T')[0],
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      vitals: record.vitals as any,
      prescriptions: record.prescriptions.map((prescription) => ({
        id: prescription.id,
        patientId: record.patientId,
        doctorId: record.doctorId,
        appointmentId: record.appointmentId,
        medications: prescription.medications as any,
        notes: prescription.notes,
        createdAt: prescription.createdAt.toISOString(),
      })),
    }));

    return res.json(formatted);
  } catch (error: any) {
    if (error.message === 'Access denied') {
      return res.status(403).json({ message: error.message });
    } else {
      return res.status(500).json({ message: error.message || 'Failed to fetch medical records' });
    }
  }
});

export default router;

