import { PrismaClient, Doctor, AppointmentStatus, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

type DoctorWithAppointments = Prisma.DoctorGetPayload<{
    include: {
        appointments: true
    }
}>;

export class DoctorAllocationService {

    // Keyword mapping for specialization inference
    private static readonly SPECIALIZATION_KEYWORDS: Record<string, string[]> = {
        'Cardiology': ['heart', 'chest pain', 'palpitation', 'cardiac', 'blood pressure'],
        'Dermatology': ['skin', 'rash', 'acne', 'itch', 'hair'],
        'Neurology': ['headache', 'dizzy', 'faint', 'seizure', 'numbness', 'brain'],
        'Orthopedics': ['bone', 'fracture', 'joint', 'muscle', 'back pain', 'knee'],
        'Pediatrics': ['child', 'baby', 'kid', 'infant'],
        'General Physician': ['fever', 'cold', 'cough', 'flu', 'weakness', 'general'],
    };

    /**
     * Allocate a doctor based on problem description
     */
    static async allocateDoctor(problemDescription: string): Promise<Doctor | null> {
        const specialization = this.inferSpecialization(problemDescription);
        console.log(`Preferred Specialization: ${specialization}`);

        // 1. Find doctors with this specialization
        let doctors = await prisma.doctor.findMany({
            where: {
                specialization: {
                    equals: specialization,
                    mode: 'insensitive',
                },
                available: true,
            },
            include: {
                appointments: {
                    where: {
                        status: {
                            in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]
                        }
                    }
                }
            }
        }) as DoctorWithAppointments[];

        // 2. If no specialist found, try General Physician (if not already tried)
        if (doctors.length === 0 && specialization !== 'General Physician') {
            console.log('No specialist found. Falling back to General Physician.');
            doctors = await prisma.doctor.findMany({
                where: {
                    specialization: 'General Physician',
                    available: true,
                },
                include: {
                    appointments: {
                        where: {
                            status: {
                                in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]
                            }
                        }
                    }
                }
            }) as DoctorWithAppointments[];
        }

        // 3. Fallback: Any available doctor
        if (doctors.length === 0) {
            console.log('No General Physician even. Finding ANY doctor.');
            doctors = await prisma.doctor.findMany({
                where: { available: true },
                include: {
                    appointments: {
                        where: {
                            status: {
                                in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]
                            }
                        }
                    }
                }
            }) as DoctorWithAppointments[];
        }

        if (doctors.length === 0) {
            return null;
        }

        // 4. Load Balancing: Pick doctor with least pending/confirmed appointments
        doctors.sort((a, b) => a.appointments.length - b.appointments.length);

        return doctors[0];
    }

    /**
     * Infer specialization from text
     */
    private static inferSpecialization(text: string): string {
        const lowerText = text.toLowerCase();

        for (const [specialization, keywords] of Object.entries(this.SPECIALIZATION_KEYWORDS)) {
            if (keywords.some(keyword => lowerText.includes(keyword))) {
                return specialization;
            }
        }

        return 'General Physician';
    }

    /**
     * Find next available 30-min slot for a doctor
     * Operating Hours: 09:00 - 17:00
     */
    static async findNextAvailableSlot(doctorId: string, preferredDateStr?: string): Promise<Date> {
        // Start checking from tomorrow if not specified, or today if business hours allow
        // Simpler: Start from preferredDate or NOW.

        let targetDate = preferredDateStr ? new Date(preferredDateStr) : new Date();

        // If targetDate is in the past, bump to today/now
        if (targetDate < new Date()) {
            targetDate = new Date();
        }

        // If scheduled for today but after 5PM, move to tomorrow
        if (targetDate.getHours() >= 17) {
            targetDate.setDate(targetDate.getDate() + 1);
            targetDate.setHours(9, 0, 0, 0);
        } else if (targetDate.getHours() < 9) {
            targetDate.setHours(9, 0, 0, 0); // Start at 9 AM
        } else {
            // Snap to next 30 min slot
            const minutes = targetDate.getMinutes();
            const remainder = minutes % 30;
            targetDate.setMinutes(minutes + (30 - remainder), 0, 0);
        }

        // Check max lookahead (e.g., 7 days) to find a slot
        for (let day = 0; day < 7; day++) {

            // Get all appointments for this doctor on this day
            const dayStart = new Date(targetDate);
            dayStart.setHours(0, 0, 0, 0);

            const dayEnd = new Date(targetDate);
            dayEnd.setHours(23, 59, 59, 999);

            const existingAppointments = await prisma.appointment.findMany({
                where: {
                    doctorId: doctorId,
                    scheduledTime: {
                        gte: dayStart,
                        lte: dayEnd
                    },
                    status: { not: AppointmentStatus.CANCELLED }
                }
            });

            // Iterate slots from 09:00 to 17:00
            // Clone targetDate to iterate
            let slotIterator = new Date(targetDate);
            // Reset to 9 AM if we moved to a new day in the loop
            if (day > 0) {
                slotIterator.setDate(slotIterator.getDate() + 1);
                slotIterator.setHours(9, 0, 0, 0);
                // Update targetDate base for next iterations
                targetDate = new Date(slotIterator);
            }

            // Slot loop for the day
            while (slotIterator.getHours() < 17) {
                const conflict = existingAppointments.find(appt => {
                    const appsTime = new Date(appt.scheduledTime).getTime();
                    const slotTime = slotIterator.getTime();
                    // Check collision (assuming 30 mins duration)
                    return Math.abs(appsTime - slotTime) < 30 * 60 * 1000;
                });

                if (!conflict) {
                    return slotIterator;
                }

                // Advance 30 mins
                slotIterator.setMinutes(slotIterator.getMinutes() + 30);
            }
        }

        throw new Error('No available slots found for this doctor in the coming week.');
    }
}
