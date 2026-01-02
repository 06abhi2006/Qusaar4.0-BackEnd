import { PrismaClient, OperationStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const OTService = {
    // Schedule a surgery
    async scheduleOperation(data: {
        patientId: string;
        doctorId: string;
        theaterName: string;
        procedureName: string;
        startTime: string | Date;
        endTime: string | Date;
        notes?: string;
    }) {
        // Basic conflict check
        const existing = await prisma.operationSchedule.findFirst({
            where: {
                theaterName: data.theaterName,
                status: { not: OperationStatus.CANCELLED },
                OR: [
                    {
                        startTime: { lt: new Date(data.endTime) },
                        endTime: { gt: new Date(data.startTime) }
                    }
                ]
            }
        });

        if (existing) {
            throw new Error(`Theater ${data.theaterName} is already booked for this time slot.`);
        }

        return prisma.operationSchedule.create({
            data: {
                patientId: data.patientId,
                doctorId: data.doctorId,
                theaterName: data.theaterName,
                procedureName: data.procedureName,
                startTime: new Date(data.startTime),
                endTime: new Date(data.endTime),
                notes: data.notes,
                status: OperationStatus.SCHEDULED
            },
            include: {
                patient: true,
                doctor: { include: { user: true } }
            }
        });
    },

    // Get all surgeries (optionally filter by date)
    async getOperations(date?: string) {
        const where: any = {};
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);

            where.startTime = {
                gte: start,
                lte: end
            };
        }

        return prisma.operationSchedule.findMany({
            where,
            orderBy: { startTime: 'asc' },
            include: {
                patient: { select: { name: true, id: true } },
                doctor: { include: { user: { select: { name: true } } } }
            }
        });
    },

    // Update status
    async updateStatus(id: string, status: OperationStatus) {
        return prisma.operationSchedule.update({
            where: { id },
            data: { status }
        });
    }
};
