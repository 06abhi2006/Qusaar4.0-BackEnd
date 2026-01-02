import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Audit Log Service
 * Centralized audit logging functionality
 */
export class AuditService {
  static async log(
    actorUserId: string,
    action: string,
    targetResource?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action,
          actorUserId,
          targetResource: targetResource || null,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
        },
      });
    } catch (error) {
      // Silent fail - don't break the application if audit logging fails
      console.error('Failed to create audit log:', error);
    }
  }

  // Common audit actions
  static readonly ACTIONS = {
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    CREATE_PATIENT: 'CREATE_PATIENT',
    UPDATE_PATIENT: 'UPDATE_PATIENT',
    VIEW_PATIENT: 'VIEW_PATIENT',
    CREATE_DOCTOR: 'CREATE_DOCTOR',
    UPDATE_DOCTOR: 'UPDATE_DOCTOR',
    DELETE_DOCTOR: 'DELETE_DOCTOR',
    CREATE_APPOINTMENT: 'CREATE_APPOINTMENT',
    UPDATE_APPOINTMENT: 'UPDATE_APPOINTMENT',
    CANCEL_APPOINTMENT: 'CANCEL_APPOINTMENT',
    CREATE_MEDICAL_RECORD: 'CREATE_MEDICAL_RECORD',
    VIEW_MEDICAL_RECORD: 'VIEW_MEDICAL_RECORD',
    VIEW_STATS: 'VIEW_STATS',
  };
}

