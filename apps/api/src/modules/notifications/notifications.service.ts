import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markRead(userId: string, id: string) {
    const found = await this.prisma.notification.findFirst({ where: { id, userId, deletedAt: null } });
    if (!found) throw new NotFoundException('Notification not found');
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  async refreshUpcoming(userId: string) {
    const until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const upcoming = await this.prisma.recurringTransaction.findMany({
      where: { userId, isActive: true, deletedAt: null, nextRunAt: { gte: new Date(), lte: until } },
    });
    for (const rule of upcoming) {
      const existingRows = await this.prisma.notification.findMany({
        where: { userId, type: 'SYSTEM', title: 'Upcoming recurring payment' },
        select: { message: true },
      });
      const existing = existingRows.find((row) => row.message.includes(rule.id));
      if (!existing) {
        await this.prisma.notification.create({
          data: {
            userId,
            type: 'SYSTEM',
            title: 'Upcoming recurring payment',
            message: `Recurring ${rule.description || rule.type.toLowerCase()} payment (${rule.id}) is due on ${rule.nextRunAt.toISOString().slice(0, 10)}.`,
            link: '/expenses',
          },
        });
      }
    }
    return this.list(userId);
  }
}
