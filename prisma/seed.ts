import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@system.com';

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (!existing) {
    const password = await bcrypt.hash('admin123', 10);

    await prisma.user.create({
      data: {
        email,
        password,
        role: UserRole.ADMIN,
        balance: 0,
      },
    });

    console.log('Admin created');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
