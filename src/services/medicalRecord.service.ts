import { PrismaClient } from '@prisma/client';
import { AuditService } from '../middleware/audit';

const prisma = new PrismaClient();

export interface CreateMedicalRecordData {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  diagnosis: string;
  treatment: string;
  prescription?: string;
  notes?: string;
  vitals?: {
    bloodPressure?: string;
    temperature?: string;
    pulse?: string;
    weight?: string;
  };
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
}

export class MedicalRecordService {
  /**
   * Create a new medical record (immutable - no updates allowed)
   */
  static async createMedicalRecord(
    data: CreateMedicalRecordData,
    createdByUserId: string
  ) {
    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Verify doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: data.doctorId },
    });

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    // Verify doctor is the one creating the record
    if (doctor.userId !== createdByUserId) {
      throw new Error('Only the assigned doctor can create medical records');
    }

    // Verify appointment if provided
    if (data.appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: data.appointmentId },
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      if (appointment.patientId !== data.patientId || appointment.doctorId !== data.doctorId) {
        throw new Error('Appointment does not match patient and doctor');
      }
    }

    // Create medical record and prescription in transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create medical record
      const medicalRecord = await tx.medicalRecord.create({
        data: {
          patientId: data.patientId,
          doctorId: data.doctorId,
          appointmentId: data.appointmentId,
          diagnosis: data.diagnosis,
          treatment: data.treatment,
          prescription: data.prescription,
          notes: data.notes,
          vitals: data.vitals ? JSON.parse(JSON.stringify(data.vitals)) : null,
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

      // Create prescription if medications provided
      if (data.medications && data.medications.length > 0) {
        await tx.prescription.create({
          data: {
            medicalRecordId: medicalRecord.id,
            medications: JSON.parse(JSON.stringify(data.medications)),
            notes: data.notes,
          },
        });
      }

      // Auto-generate Bill (Standard Consultation Fee: $50)
      await tx.bill.create({
        data: {
          patientId: data.patientId,
          doctorId: data.doctorId,
          appointmentId: data.appointmentId,
          medicalRecordId: medicalRecord.id,
          amount: 50.00,
          status: 'PENDING'
        }
      });

      // Update appointment status to completed if appointmentId provided
      if (data.appointmentId) {
        await tx.appointment.update({
          where: { id: data.appointmentId },
          data: { status: 'completed' },
        });
      }

      return medicalRecord;
    });

    // Fetch complete record with prescription
    const completeRecord = await prisma.medicalRecord.findUnique({
      where: { id: result.id },
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
        prescriptions: true,
      },
    });

    // Audit log
    await AuditService.log(
      createdByUserId,
      AuditService.ACTIONS.CREATE_MEDICAL_RECORD,
      `medical_record:${result.id}`,
      {
        patientId: data.patientId,
        appointmentId: data.appointmentId,
      }
    );

    return completeRecord;
  }

  /**
   * Get medical records for a patient with access control
   */
  static async getPatientMedicalRecords(
    patientId: string,
    requesterUserId: string,
    requesterRole: string
  ) {
    // Access control
    if (requesterRole === 'patient') {
      // Patients can only view their own records
      const patient = await prisma.patient.findUnique({
        where: { userId: requesterUserId },
      });

      if (!patient || patient.id !== patientId) {
        throw new Error('Access denied');
      }
    } else if (requesterRole === 'doctor') {
      // Doctors can only view records for their patients
      // This is a simplified check - in production, you might want to check
      // if the doctor has any appointments with this patient
      const doctor = await prisma.doctor.findUnique({
        where: { userId: requesterUserId },
      });

      if (!doctor) {
        throw new Error('Doctor not found');
      }
    }

    const records = await prisma.medicalRecord.findMany({
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
        prescriptions: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Audit log
    await AuditService.log(
      requesterUserId,
      AuditService.ACTIONS.VIEW_MEDICAL_RECORD,
      `patient:${patientId}`,
      { recordCount: records.length }
    );

    return records;
  }

  /**
   * Get medical record by ID with access control
   */
  static async getMedicalRecordById(
    recordId: string,
    requesterUserId: string,
    requesterRole: string
  ) {
    const record = await prisma.medicalRecord.findUnique({
      where: { id: recordId },
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
        prescriptions: true,
      },
    });

    if (!record) {
      throw new Error('Medical record not found');
    }

    // Access control
    if (requesterRole === 'patient') {
      if (record.patient.userId !== requesterUserId) {
        throw new Error('Access denied');
      }
    } else if (requesterRole === 'doctor') {
      if (record.doctor.userId !== requesterUserId) {
        throw new Error('Access denied');
      }
    }

    // Audit log
    await AuditService.log(
      requesterUserId,
      AuditService.ACTIONS.VIEW_MEDICAL_RECORD,
      `medical_record:${recordId}`
    );

    return record;
  }
}

