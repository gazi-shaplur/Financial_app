import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.SUPER_ADMIN_PASSWORD;
const name = process.env.SUPER_ADMIN_NAME?.trim() || 'Super Administrator';

if (!email || !password || password.length < 10) {
  throw new Error('Set SUPER_ADMIN_EMAIL and a 10-character SUPER_ADMIN_PASSWORD');
}

const prisma = new PrismaClient();
const role = await prisma.role.upsert({
  where: { name: 'SUPER_ADMIN' },
  update: {},
  create: { name: 'SUPER_ADMIN', description: 'Full platform administrator' },
});
const existing = await prisma.user.findUnique({ where: { email } });
const passwordHash = await bcrypt.hash(password, 12);
const user = existing
  ? await prisma.user.update({ where: { id: existing.id }, data: { name, passwordHash, status: 'ACTIVE', deletedAt: null } })
  : await prisma.user.create({ data: { name, email, passwordHash } });
await prisma.userRole.upsert({
  where: { userId_roleId: { userId: user.id, roleId: role.id } },
  update: {},
  create: { userId: user.id, roleId: role.id },
});
console.log(`Super Admin ready: ${email}`);
await prisma.$disconnect();
