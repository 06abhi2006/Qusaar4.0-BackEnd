import { PrismaClient, LabStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const LabService = {
    // --- Test Catalog Management ---

    // Get all available test types
    async getAllTests() {
        return prisma.labTest.findMany({
            orderBy: { name: 'asc' }
        });
    },

    // Create a new test type
    async createTest(data: {
        name: string;
        code: string;
        category: string;
        price: number;
        normalRange?: string;
        units?: string;
    }) {
        return prisma.labTest.create({
            data
        });
    },

    // --- Lab Request Management ---

    // Get requests (optionally filtered by status)
    async getRequests(status?: LabStatus) {
        const where: any = {};
        if (status) {
            where.status = status;
        }

        return prisma.labRequest.findMany({
            where,
            include: {
                patient: { select: { user: { select: { name: true } }, id: true, gender: true, age: true } },
                doctor: { include: { user: { select: { name: true } } } },
                test: true
            },
            orderBy: { requestedAt: 'desc' }
        });
    },

    // Create a new lab request (Usually called by Doctor)
    async createRequest(data: {
        patientId: string;
        doctorId: string;
        testId: string;
        notes?: string;
    }) {
        return prisma.labRequest.create({
            data: {
                patientId: data.patientId,
                doctorId: data.doctorId,
                testId: data.testId,
                notes: data.notes,
                status: LabStatus.PENDING
            }
        });
    },

    // Update request with results
    async updateResult(id: string, data: {
        resultValue: string;
        notes?: string;
        status?: LabStatus;
    }) {
        return prisma.labRequest.update({
            where: { id },
            data: {
                resultValue: data.resultValue,
                notes: data.notes,
                status: data.status || LabStatus.COMPLETED,
                completedAt: new Date()
            }
        });
    }
};
