import { PrismaClient, ClaimStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const InsuranceService = {
    // --- Policy Management ---

    // Add a new policy for a patient
    async addPolicy(data: {
        patientId: string;
        providerName: string;
        policyNumber: string;
        coverageAmount: number;
        validFrom: string | Date;
        validTill: string | Date;
    }) {
        return prisma.insurancePolicy.create({
            data: {
                patientId: data.patientId,
                providerName: data.providerName,
                policyNumber: data.policyNumber,
                coverageAmount: data.coverageAmount,
                validFrom: new Date(data.validFrom),
                validTill: new Date(data.validTill)
            }
        });
    },

    // Get policies (optionally filtered by patient)
    async getPolicies(patientId?: string) {
        const where: any = {};
        if (patientId) where.patientId = patientId;

        return prisma.insurancePolicy.findMany({
            where,
            include: {
                patient: { select: { user: { select: { name: true } }, id: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    },

    // --- Claim Management ---

    // Submit a claim for a bill
    async submitClaim(data: {
        policyId: string;
        billId: string;
        amount: number;
        notes?: string;
    }) {
        return prisma.insuranceClaim.create({
            data: {
                policyId: data.policyId,
                billId: data.billId,
                amount: data.amount,
                notes: data.notes,
                status: ClaimStatus.SUBMITTED
            }
        });
    },

    // Get claims (optionally filtered by status)
    async getClaims(status?: ClaimStatus) {
        const where: any = {};
        if (status) where.status = status;

        return prisma.insuranceClaim.findMany({
            where,
            include: {
                policy: { include: { patient: { select: { user: { select: { name: true } } } } } },
                bill: true
            },
            orderBy: { createdAt: 'desc' }
        });
    },

    // Process a claim (Approve/Reject)
    async processClaim(id: string, data: {
        status: ClaimStatus;
        notes?: string;
    }) {
        return prisma.insuranceClaim.update({
            where: { id },
            data: {
                status: data.status,
                notes: data.notes
            }
        });
    }
};
