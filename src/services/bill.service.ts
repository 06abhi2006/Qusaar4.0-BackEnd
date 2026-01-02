import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class BillService {
    /**
     * Get all pending bills, optionally filtered by patient name or ID
     */
    static async getPendingBills(searchTerm?: string) {
        const whereClause: any = {
            status: 'PENDING',
        };

        if (searchTerm) {
            whereClause.OR = [
                { patient: { user: { name: { contains: searchTerm, mode: 'insensitive' } } } },
                { patient: { id: { contains: searchTerm } } },
            ];
        }

        return await prisma.bill.findMany({
            where: whereClause,
            include: {
                patient: {
                    include: {
                        user: {
                            select: { name: true, email: true }
                        }
                    }
                },
                doctor: {
                    include: {
                        user: {
                            select: { name: true }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    /**
     * Mark a bill as PAID
     */
    static async markAsPaid(billId: string, cashierId: string) {
        const bill = await prisma.bill.findUnique({
            where: { id: billId }
        });

        if (!bill) {
            throw new Error('Bill not found');
        }

        if (bill.status === 'PAID') {
            throw new Error('Bill is already paid');
        }

        // Verify cashier exists
        const cashier = await prisma.user.findUnique({
            where: { id: cashierId, role: 'cashier' },
            include: { cashier: true } // Ensure cashier profile exists
        });

        if (!cashier || !cashier.cashier) {
            throw new Error('Invalid cashier');
        }

        return await prisma.bill.update({
            where: { id: billId },
            data: {
                status: 'PAID',
                paymentDate: new Date(),
                cashierId: cashier.cashier.id
            },
            include: {
                patient: { include: { user: true } },
                doctor: { include: { user: true } },
                cashier: { include: { user: true } }
            }
        });
    }

    /**
     * Get Bill by ID (for PDF generation)
     */
    static async getBillById(billId: string) {
        return await prisma.bill.findUnique({
            where: { id: billId },
            include: {
                patient: { include: { user: true } },
                doctor: { include: { user: true } },
                cashier: { include: { user: true } },
                medicalRecord: true
            }
        });
    }
}
