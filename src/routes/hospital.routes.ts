import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/hospital/map
 * Get hierarchical hospital map data
 */
router.get('/map', async (_req: Request, res: Response) => {
    try {
        const departments = await prisma.department.findMany({
            include: {
                doctors: {
                    select: {
                        id: true,
                        user: { select: { name: true, status: true } }, // Moved status to user select
                        cabinNumber: true,
                        specialization: true, // Removed status from here
                        consultationFee: true,
                        biography: true,
                        available: true,
                    }
                }
            },
            orderBy: { floor: 'asc' }
        });

        // Group by floor
        const floorsMap = new Map<number, any[]>();

        departments.forEach((dept) => {
            if (!floorsMap.has(dept.floor)) {
                floorsMap.set(dept.floor, []);
            }

            // Explicitly type doc to avoid implicit any
            const doctorsFormatted = dept.doctors.map((doc: any) => ({
                id: doc.id,
                name: doc.user.name,
                cabin: doc.cabinNumber,
                specialization: doc.specialization,
                fee: doc.consultationFee,
                available: doc.available,
                bio: doc.biography
            }));

            floorsMap.get(dept.floor)!.push({
                id: dept.id,
                name: dept.name,
                wing: dept.wing,
                description: dept.description,
                doctors: doctorsFormatted
            });
        });

        const result = Array.from(floorsMap.entries()).map(([floor, depts]) => ({
            floorNumber: floor,
            departments: depts
        }));

        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({ message: error.message || 'Failed to fetch hospital map' });
    }
});

export default router;
