import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async profile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
    if (!user || user.deletedAt) throw new NotFoundException('User not found');
    const { passwordHash, ...safe } = user;
    return { ...safe, roles: safe.roles.map((entry) => entry.role.name) };
  }

  updateProfile(userId: string, dto: any) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
  }

  sessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, ipAddress: true, userAgent: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({ where: { id: sessionId, userId } });
    if (!session) throw new NotFoundException('Session not found');
    await this.prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
    return { success: true };
  }

  async listUsers(query: any) {
    const page = Math.max(1, Number(query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize || 20)));
    const search = String(query.search || '').trim();
    const status = String(query.status || '').trim();
    const where: any = {
      deletedAt: null,
      ...(search ? { OR: [{ email: { contains: search, mode: 'insensitive' } }, { name: { contains: search, mode: 'insensitive' } }] } : {}),
      ...(status ? { status } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: { roles: { include: { role: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      items: items.map((user) => {
        const { passwordHash, ...safe } = user;
        return { ...safe, roles: user.roles.map((entry) => entry.role.name) };
      }),
      page,
      pageSize,
      total,
    };
  }

  async updateUserStatus(adminId: string, userId: string, status: string) {
    if (!['ACTIVE', 'SUSPENDED'].includes(status)) throw new BadRequestException('Invalid status');
    if (adminId === userId) throw new BadRequestException('You cannot change your own account status');
    const user = await this.prisma.user.update({ where: { id: userId }, data: { status } });
    await this.prisma.auditLog.create({
      data: { actorId: adminId, targetId: userId, action: 'UPDATE_STATUS', entityType: 'USER', entityId: userId, metadata: { status } },
    });
    return { id: user.id, status: user.status };
  }
}
