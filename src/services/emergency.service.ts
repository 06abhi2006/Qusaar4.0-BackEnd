import { PrismaClient, EmergencyStatus, TriageLevel } from '@prisma/client';

const prisma = new PrismaClient();

export const EmergencyService = {
    // Create a new emergency case
    async createCase(data: {
        patientName: string;
        patientId?: string;
        symptoms: string;
        triageLevel: TriageLevel;
        notes?: string;
    }) {
        return prisma.emergencyCase.create({
            data: {
                patientName: data.patientName,
                patientId: data.patientId,
                symptoms: data.symptoms,
                triageLevel: data.triageLevel,
                notes: data.notes,
                status: EmergencyStatus.TRIAGE
            }
        });
    },

    // Get all active cases (not discharged)
    async getActiveCases() {
        return prisma.emergencyCase.findMany({
            where: {
                status: {
                    not: EmergencyStatus.DISCHARGED
                }
            },
            orderBy: [
                // Prioritize CRITICAL cases, then by arrival time
                { triageLevel: 'asc' }, // CRITICAL comes before NORMAL usually in alpha, but let's check enum order.
                // Enum is CRITICAL, MODERATE, NORMAL. Alphabetically C < M < N. So asc works.
                { createdAt: 'desc' }
            ],
            include: {
                patient: true
            }
        });
    },

    // Update Triage Level
    async updateTriageLevel(id: string, level: TriageLevel) {
        return prisma.emergencyCase.update({
            where: { id },
            data: { triageLevel: level }
        });
    },

    // Update Status (e.g., move to TREATMENT)
    async updateStatus(id: string, status: EmergencyStatus) {
        return prisma.emergencyCase.update({
            where: { id },
            data: { status }
        });
    },

    // Assign a doctor/nurse
    async assignProvider(id: string, providerId: string) {
        return prisma.emergencyCase.update({
            where: { id },
            data: { careProviderId: providerId }
        });
    }
};
