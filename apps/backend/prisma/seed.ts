// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);

  await prisma.user.upsert({
    where: { email: 'admin@freemonitor.dev' },
    update: {},
    create: {
      email: 'admin@freemonitor.dev',
      name: 'Admin User',
      password: hashedPassword,
      isActive: true,
    },
  });
}

main()
  .then(() => console.log('Seed completed'))
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });