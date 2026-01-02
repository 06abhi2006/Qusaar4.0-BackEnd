import { PrismaClient } from '@prisma/client';
import { AuditService } from '../middleware/audit';
import { AuthService } from './auth.service';

const prisma = new PrismaClient();

export interface CreateDoctorData {
  name: string;
  email: string;
  password: string;
  specialization: string;
  department: string;
  phone: string;
}

export class DoctorService {
  /**
   * Create a new doctor with user account
   */
  static async createDoctor(data: CreateDoctorData, createdByUserId: string) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await AuthService.hashPassword(data.password);

    // Create user and doctor in transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          name: data.name,
          passwordHash,
          role: 'doctor',
          status: 'active',
        },
      });

      // Create doctor
      const doctor = await tx.doctor.create({
        data: {
          userId: user.id,
          specialization: data.specialization,
          department: data.department,
          phone: data.phone,
          available: true,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          department: true,
        },
      });

      return doctor;
    });

    // Audit log
    await AuditService.log(
      createdByUserId,
      AuditService.ACTIONS.CREATE_DOCTOR,
      `doctor:${result.id}`,
      { doctorEmail: data.email }
    );

    return result;
  }

  /**
   * Update doctor information
   */
  static async updateDoctor(
    doctorId: string,
    data: Partial<CreateDoctorData>,
    updatedByUserId: string
  ) {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    // Update user if name/email changed
    if (data.name || data.email) {
      await prisma.user.update({
        where: { id: doctor.userId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.email && { email: data.email }),
        },
      });
    }

    // Update doctor
    const updated = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        ...(data.specialization && { specialization: data.specialization }),
        ...(data.department && { departmentId: data.department }),
        ...(data.phone && { phone: data.phone }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        department: true,
      },
    });

    // Audit log
    await AuditService.log(
      updatedByUserId,
      AuditService.ACTIONS.UPDATE_DOCTOR,
      `doctor:${doctorId}`
    );

    return updated;
  }

  /**
   * Toggle doctor availability
   */
  static async toggleAvailability(
    doctorId: string,
    available: boolean,
    updatedByUserId: string
  ) {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    const updated = await prisma.doctor.update({
      where: { id: doctorId },
      data: { available },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        department: true,
      },
    });

    // Audit log
    await AuditService.log(
      updatedByUserId,
      AuditService.ACTIONS.UPDATE_DOCTOR,
      `doctor:${doctorId}`,
      { action: 'toggle_availability', available }
    );

    return updated;
  }

  /**
   * Get all doctors
   */
  static async getAllDoctors(availableOnly: boolean = false) {
    return prisma.doctor.findMany({
      where: availableOnly ? { available: true } : undefined,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        department: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get doctor by ID
   */
  static async getDoctorById(doctorId: string) {
    return prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        department: true,
      },
    });
  }
}

