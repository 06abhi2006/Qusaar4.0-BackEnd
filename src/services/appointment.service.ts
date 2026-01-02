import { PrismaClient, AppointmentStatus } from '@prisma/client';
import { AuditService } from '../middleware/audit';

const prisma = new PrismaClient();

export interface CreateAppointmentData {
  patientId: string;
  doctorId: string;
  scheduledTime: Date;
  reason: string;
}

export class AppointmentService {
  /**
   * Create a new appointment
   */
  static async createAppointment(
    data: CreateAppointmentData,
    createdByUserId: string
  ) {
    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Verify doctor exists and is available
    const doctor = await prisma.doctor.findUnique({
      where: { id: data.doctorId },
    });

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    if (!doctor.available) {
      throw new Error('Doctor is not available');
    }

    // Check for conflicting appointments (optional - can be enhanced)
    const conflicting = await prisma.appointment.findFirst({
      where: {
        doctorId: data.doctorId,
        scheduledTime: data.scheduledTime,
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
      },
    });

    if (conflicting) {
      throw new Error('Doctor already has an appointment at this time');
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        scheduledTime: data.scheduledTime,
        reason: data.reason,
        status: AppointmentStatus.PENDING,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Audit log
    await AuditService.log(
      createdByUserId,
      AuditService.ACTIONS.CREATE_APPOINTMENT,
      `appointment:${appointment.id}`,
      {
        patientId: data.patientId,
        doctorId: data.doctorId,
      }
    );

    return appointment;
  }

  /**
   * Get appointments for today for a specific doctor
   */
  static async getTodayAppointments(doctorId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledTime: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledTime: 'asc',
      },
    });
  }

  /**
   * Get appointment by ID with access control
   */
  static async getAppointmentById(
    appointmentId: string,
    requesterUserId: string,
    requesterRole: string
  ) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Access control
    if (requesterRole === 'patient') {
      // Patients can only view their own appointments
      if (appointment.patient.userId !== requesterUserId) {
        throw new Error('Access denied');
      }
    } else if (requesterRole === 'doctor') {
      // Doctors can only view their own appointments
      if (appointment.doctor.userId !== requesterUserId) {
        throw new Error('Access denied');
      }
    }

    return appointment;
  }

  /**
   * Get all appointments for a patient
   */
  static async getPatientAppointments(patientId: string) {
    return prisma.appointment.findMany({
      where: { patientId },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledTime: 'desc',
      },
    });
  }

  /**
   * Update appointment status
   */
  static async updateAppointmentStatus(
    appointmentId: string,
    status: AppointmentStatus,
    updatedByUserId: string
  ) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Audit log
    const action =
      status === AppointmentStatus.CANCELLED
        ? AuditService.ACTIONS.CANCEL_APPOINTMENT
        : AuditService.ACTIONS.UPDATE_APPOINTMENT;

    await AuditService.log(updatedByUserId, action, `appointment:${appointmentId}`, {
      status,
    });

    return updated;
  }
}

