import { PrismaClient, AdmissionStatus, BedStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const IPDService = {
    // --- Ward & Bed Management ---
    async getAllWards() {
        return prisma.ward.findMany({
            include: {
                beds: {
                    orderBy: { bedNumber: 'asc' }
                }
            }
        });
    },

    async createWard(data: { name: string; type: string; floor: number; capacity: number; gender?: string }) {
        // Create ward
        const ward = await prisma.ward.create({
            data: {
                name: data.name,
                type: data.type,
                floor: data.floor,
                capacity: data.capacity,
                gender: data.gender
            }
        });

        // Auto-generate beds
        const bedsData = Array.from({ length: data.capacity }).map((_, i) => ({
            wardId: ward.id,
            bedNumber: `${ward.name.substring(0, 3).toUpperCase()}-${101 + i}`,
            status: BedStatus.AVAILABLE
        }));

        await prisma.bed.createMany({ data: bedsData });

        return this.getWardById(ward.id);
    },

    async getWardById(id: string) {
        return prisma.ward.findUnique({
            where: { id },
            include: {
                beds: {
                    include: {
                        admission: {
                            where: { status: AdmissionStatus.ADMITTED },
                            include: {
                                patient: { include: { user: true } },
                                doctor: { include: { user: true } }
                            }
                        }
                    }
                }
            }
        });
    },

    // --- Admissions ---
    async admitPatient(data: { patientId: string; doctorId: string; bedId: string; diagnosis?: string; notes?: string }) {
        return prisma.$transaction(async (tx) => {
            // 1. Check bed availability
            const bed = await tx.bed.findUnique({ where: { id: data.bedId } });
            if (!bed || bed.status !== BedStatus.AVAILABLE) {
                throw new Error('Bed is not available');
            }

            // 2. Create Admission
            const admission = await tx.iPDAdmission.create({
                data: {
                    patientId: data.patientId,
                    doctorId: data.doctorId,
                    bedId: data.bedId,
                    diagnosis: data.diagnosis,
                    notes: data.notes,
                    status: AdmissionStatus.ADMITTED
                }
            });

            // 3. Update Bed Status
            await tx.bed.update({
                where: { id: data.bedId },
                data: { status: BedStatus.OCCUPIED }
            });

            return admission;
        });
    },

    async dischargePatient(admissionId: string) {
        return prisma.$transaction(async (tx) => {
            const admission = await tx.iPDAdmission.findUnique({ where: { id: admissionId } });
            if (!admission) throw new Error('Admission not found');

            // 1. Update Admission
            const updatedAdmission = await tx.iPDAdmission.update({
                where: { id: admissionId },
                data: {
                    status: AdmissionStatus.DISCHARGED,
                    dischargeDate: new Date()
                }
            });

            // 2. Free the Bed
            await tx.bed.update({
                where: { id: admission.bedId },
                data: { status: BedStatus.AVAILABLE } // Or CLEANING if we want that workflow
            });

            return updatedAdmission;
        });
    },

    async getActiveAdmissions() {
        return prisma.iPDAdmission.findMany({
            where: { status: AdmissionStatus.ADMITTED },
            include: {
                patient: { include: { user: true } },
                doctor: { include: { user: true } },
                bed: { include: { ward: true } }
            }
        });
    }
};
