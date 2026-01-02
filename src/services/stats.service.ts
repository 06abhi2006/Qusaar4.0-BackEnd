import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface HospitalStats {
  totalPatients: number;
  appointmentsToday: number;
  totalDoctors: number;
  totalStaff: number;
}

export class StatsService {
  /**
   * Get hospital statistics (admin only)
   */
  static async getHospitalStats(): Promise<HospitalStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalPatients, appointmentsToday, totalDoctors, totalStaff] =
      await Promise.all([
        prisma.patient.count(),
        prisma.appointment.count({
          where: {
            scheduledTime: {
              gte: today,
              lt: tomorrow,
            },
          },
        }),
        prisma.doctor.count(),
        prisma.user.count({
          where: {
            role: {
              in: ['receptionist', 'admin'],
            },
          },
        }),
      ]);

    return {
      totalPatients,
      appointmentsToday,
      totalDoctors,
      totalStaff,
    };
  }
}

