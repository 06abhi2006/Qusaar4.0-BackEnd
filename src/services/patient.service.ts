import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuditService } from '../middleware/audit';

const prisma = new PrismaClient();

export interface CreatePatientData {
  name: string;
  email: string;
  password: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  address: string;
  bloodGroup?: string;
  allergies?: string;
  emergencyContact?: string;
}

export class PatientService {
  /**
   * Create a new patient with user account
   */
  static async createPatient(
    data: CreatePatientData,
    createdByUserId: string
  ) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user and patient in transaction
    try {
      const result = await prisma.$transaction(async (tx: any) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email: data.email,
            name: data.name,
            passwordHash,
            role: 'patient',
            status: 'active',
          },
        });

        // Create patient
        const patient = await tx.patient.create({
          data: {
            userId: user.id,
            age: data.age,
            gender: data.gender,
            phone: data.phone,
            address: data.address,
            bloodGroup: data.bloodGroup,
            allergies: data.allergies,
            emergencyContact: data.emergencyContact,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        });

        return patient;
      });

      // Audit log
      await AuditService.log(
        createdByUserId,
        AuditService.ACTIONS.CREATE_PATIENT,
        `patient:${result.id}`,
        { patientEmail: data.email }
      );

      return result;
    } catch (error) {
      console.error('Error creating patient transaction:', error);
      throw error;
    }
  }

  /**
   * Get patient by ID with access control
   */
  static async getPatientById(patientId: string, requesterUserId: string, requesterRole: string) {
    // Check if requester has access
    if (requesterRole === 'patient') {
      // Patients can only view their own records
      const patient = await prisma.patient.findUnique({
        where: { userId: requesterUserId },
      });
      if (!patient || patient.id !== patientId) {
        throw new Error('Access denied');
      }
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Audit log
    await AuditService.log(
      requesterUserId,
      AuditService.ACTIONS.VIEW_PATIENT,
      `patient:${patientId}`
    );

    return patient;
  }

  /**
   * Get all patients (for receptionist/admin)
   */
  static async getAllPatients() {
    return prisma.patient.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

