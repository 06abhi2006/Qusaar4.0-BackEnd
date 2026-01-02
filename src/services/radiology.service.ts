import { PrismaClient, RadiologyStatus, RadiologyTestType } from '@prisma/client';

const prisma = new PrismaClient();

export const RadiologyService = {
    // Get requests (optionally filtered by status)
    async getRequests(status?: RadiologyStatus) {
        const where: any = {};
        if (status) {
            where.status = status;
        }

        return prisma.radiologyRequest.findMany({
            where,
            include: {
                patient: { select: { user: { select: { name: true } }, id: true, gender: true, age: true } },
                doctor: { include: { user: { select: { name: true } } } }
            },
            orderBy: { requestedAt: 'desc' }
        });
    },

    // Create a new radiology request (Usually called by Doctor)
    async createRequest(data: {
        patientId: string;
        doctorId: string;
        testType: RadiologyTestType;
        bodyPart: string;
    }) {
        return prisma.radiologyRequest.create({
            data: {
                patientId: data.patientId,
                doctorId: data.doctorId,
                testType: data.testType,
                bodyPart: data.bodyPart,
                status: RadiologyStatus.PENDING
            }
        });
    },

    // Update request with findings and results
    async updateRequest(id: string, data: {
        findings?: string;
        imageUrl?: string;
        reportUrl?: string;
        status?: RadiologyStatus;
    }) {
        return prisma.radiologyRequest.update({
            where: { id },
            data: {
                findings: data.findings,
                imageUrl: data.imageUrl,
                reportUrl: data.reportUrl,
                status: data.status || RadiologyStatus.COMPLETED,
                completedAt: new Date()
            }
        });
    }
};
