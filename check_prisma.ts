import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Keys on prisma client:', Object.keys(prisma));
    // Specifically check for IPD variants
    console.log('iPDAdmission:', (prisma as any).iPDAdmission ? 'Exists' : 'Missing');
    console.log('ipdAdmission:', (prisma as any).ipdAdmission ? 'Exists' : 'Missing');
    console.log('IPDAdmission:', (prisma as any).IPDAdmission ? 'Exists' : 'Missing');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
