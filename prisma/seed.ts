import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Production settings
  const seedPassword = process.env.SEED_PASSWORD || 'Dada@2006';

  // Hash password
  const defaultPassword = await bcrypt.hash(seedPassword, 10);

  // Create Admin Only
  await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {
      passwordHash: defaultPassword,
    },
    create: {
      email: 'admin@gmail.com',
      name: 'Abhishek (System Administrator)',
      passwordHash: defaultPassword,
      role: 'admin',
      status: 'active',
    },
  });
  console.log('✅ Created admin user');

  // Create Cashier
  const cashierUser = await prisma.user.upsert({
    where: { email: 'cashier@gmail.com' },
    update: {
      passwordHash: defaultPassword,
    },
    create: {
      email: 'cashier@gmail.com',
      name: 'Head Cashier',
      passwordHash: defaultPassword,
      role: 'cashier',
      status: 'active',
    },
  });

  await prisma.cashier.upsert({
    where: { userId: cashierUser.id },
    update: {},
    create: {
      userId: cashierUser.id,
      shiftType: 'DAY',
      workStartTime: '09:00',
      workEndTime: '17:00',
    },
  });
  console.log('✅ Created cashier user');

  // Create Departments
  const cardio = await prisma.department.upsert({
    where: { name: 'Cardiology' },
    update: {},
    create: { name: 'Cardiology', floor: 1, wing: 'East Wing', description: 'Heart and vascular system' }
  });

  const ortho = await prisma.department.upsert({
    where: { name: 'Orthopedics' },
    update: {},
    create: { name: 'Orthopedics', floor: 2, wing: 'West Wing', description: 'Bone and joint care' }
  });

  await prisma.department.upsert({
    where: { name: 'Neurology' },
    update: {},
    create: { name: 'Neurology', floor: 3, wing: 'North Wing', description: 'Brain and nervous system' }
  });

  await prisma.department.upsert({
    where: { name: 'Pediatrics' },
    update: {},
    create: { name: 'Pediatrics', floor: 1, wing: 'South Wing', description: 'Child healthcare' }
  });

  console.log('✅ Created departments');

  // Create Doctor (Dr. Sarah Smith - Cardiology)
  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@gmail.com' },
    update: {
      passwordHash: defaultPassword,
    },
    create: {
      email: 'doctor@gmail.com',
      name: 'Dr. Shruti Ugale',
      passwordHash: defaultPassword,
      role: 'doctor',
      status: 'active',
    },
  });

  await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: {
      department: { connect: { id: cardio.id } },
    },
    create: {
      user: { connect: { id: doctorUser.id } },
      specialization: 'Cardiologist',
      department: { connect: { id: cardio.id } },
      cabinNumber: '101',
      phone: '1234567890',
      available: true,
      consultationFee: 800.00,
      biography: 'Expert in interventional cardiology with 10 years experience.'
    },
  });
  console.log('✅ Created doctor user (Cardiology)');

  // Create Second Doctor (Dr. James Wilson - Orthopedics)
  const doctorUser2 = await prisma.user.upsert({
    where: { email: 'ortho@gmail.com' },
    update: { passwordHash: defaultPassword },
    create: {
      email: 'ortho@gmail.com',
      name: 'Dr. Hemangini Patil',
      passwordHash: defaultPassword,
      role: 'doctor',
      status: 'active',
    },
  });

  await prisma.doctor.upsert({
    where: { userId: doctorUser2.id },
    update: { department: { connect: { id: ortho.id } } },
    create: {
      user: { connect: { id: doctorUser2.id } },
      specialization: 'Orthopedic Surgeon',
      department: { connect: { id: ortho.id } },
      cabinNumber: '205',
      phone: '9876543210',
      available: true,
      consultationFee: 700.00,
      biography: 'Specialist in joint replacement and sports injuries.'
    },
  });
  console.log('✅ Created doctor user (Orthopedics)');

  // Create Nurse
  const nurseUser = await prisma.user.upsert({
    where: { email: 'nurse@gmail.com' },
    update: { passwordHash: defaultPassword },
    create: {
      email: 'nurse@gmail.com',
      name: 'Nancy Nurse',
      passwordHash: defaultPassword,
      role: 'nurse',
      status: 'active',
    },
  });

  await prisma.nurse.upsert({
    where: { userId: nurseUser.id },
    update: {},
    create: {
      userId: nurseUser.id,
      shiftType: 'DAY',
      workStartTime: '07:00',
      workEndTime: '19:00',
      isActive: true,
    },
  });
  console.log('✅ Created nurse user');

  // Create Lab Technician
  const labUser = await prisma.user.upsert({
    where: { email: 'lab@gmail.com' },
    update: { passwordHash: defaultPassword },
    create: {
      email: 'lab@gmail.com',
      name: 'Larry LabTech',
      passwordHash: defaultPassword,
      role: 'lab_technician',
      status: 'active',
    },
  });

  await prisma.labTechnician.upsert({
    where: { userId: labUser.id },
    update: {},
    create: {
      userId: labUser.id,
      isActive: true,
    },
  });
  console.log('✅ Created lab technician user');

  // Create Radiologist
  const radioUser = await prisma.user.upsert({
    where: { email: 'radio@gmail.com' },
    update: { passwordHash: defaultPassword },
    create: {
      email: 'radio@gmail.com',
      name: 'Randy Radiologist',
      passwordHash: defaultPassword,
      role: 'radiologist',
      status: 'active',
    },
  });

  await prisma.radiologist.upsert({
    where: { userId: radioUser.id },
    update: {},
    create: {
      userId: radioUser.id,
      isActive: true,
    },
  });
  console.log('✅ Created radiologist user');

  // Create Pharmacist
  const pharmaUser = await prisma.user.upsert({
    where: { email: 'pharma@gmail.com' },
    update: { passwordHash: defaultPassword },
    create: {
      email: 'pharma@gmail.com',
      name: 'Polly Pharmacist',
      passwordHash: defaultPassword,
      role: 'pharmacist',
      status: 'active',
    },
  });

  await prisma.pharmacist.upsert({
    where: { userId: pharmaUser.id },
    update: {},
    create: {
      userId: pharmaUser.id,
      isActive: true,
    },
  });
  console.log('✅ Created pharmacist user');

  // Create Receptionist
  const receptionistUser = await prisma.user.upsert({
    where: { email: 'receptionist@gmail.com' },
    update: {
      passwordHash: defaultPassword,
    },
    create: {
      email: 'receptionist@gmail.com',
      name: 'John Receptionist',
      passwordHash: defaultPassword,
      role: 'receptionist',
      status: 'active',
    },
  });

  await prisma.receptionist.upsert({
    where: { userId: receptionistUser.id },
    update: {},
    create: {
      userId: receptionistUser.id,
      shiftType: 'DAY',
      workStartTime: '08:00',
      workEndTime: '16:00',
    },
  });
  console.log('✅ Created receptionist user');

  console.log('🎉 Seeding completed!');
  console.log('\n🔐 CREDENTIALS:');
  console.log(`Password for all: ${seedPassword}`);
  console.log('Admin: admin@gmail.com');
  console.log('Doctor: doctor@gmail.com');
  console.log('Receptionist: receptionist@gmail.com');
  console.log('Receptionist: receptionist@gmail.com');
  console.log('Cashier: cashier@gmail.com');
  console.log('Nurse: nurse@gmail.com');
  console.log('Lab: lab@gmail.com');
  console.log('Radiology: radio@gmail.com');
  console.log('Pharmacy: pharma@gmail.com');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
