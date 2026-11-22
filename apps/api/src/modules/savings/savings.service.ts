import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class SavingsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.savingsPot.findMany({
      where: { userId, archivedAt: null },
      include: { transactions: { orderBy: { occurredAt: 'desc' }, take: 10 } },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(userId: string, dto: any) {
    if (Number(dto.targetAmount) <= 0) throw new BadRequestException('Target amount must be greater than zero');
    return this.prisma.savingsPot.create({
      data: {
        userId,
        name: dto.name,
        targetAmount: dto.targetAmount,
        currencyCode: dto.currencyCode,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        color: dto.color,
        icon: dto.icon,
      },
    });
  }

  async adjust(userId: string, potId: string, amount: string, type: 'DEPOSIT' | 'WITHDRAW') {
    const amountNumber = Number(amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) throw new BadRequestException('Amount must be greater than zero');
    const pot = await this.prisma.savingsPot.findFirst({ where: { id: potId, userId, archivedAt: null } });
    if (!pot) throw new NotFoundException('Savings pot not found');
    const current = Number(pot.currentAmount);
    if (type === 'WITHDRAW' && amountNumber > current) throw new BadRequestException('Insufficient savings balance');
    const next = type === 'DEPOSIT' ? current + amountNumber : current - amountNumber;
    await this.prisma.$transaction([
      this.prisma.savingsPot.update({ where: { id: potId }, data: { currentAmount: next.toFixed(4) } }),
      this.prisma.savingsTransaction.create({ data: { savingsPotId: potId, amount: amountNumber.toFixed(4), type } }),
    ]);
    const updated = await this.prisma.savingsPot.findUnique({ where: { id: potId }, include: { transactions: { orderBy: { occurredAt: 'desc' } } } });
    await this.prisma.notification.create({
      data: {
        userId,
        type: 'SAVINGS',
        title: type === 'DEPOSIT' ? 'Savings deposit' : 'Savings withdrawal',
        message: `${amountNumber.toFixed(2)} ${pot.currencyCode} was ${type === 'DEPOSIT' ? 'added to' : 'withdrawn from'} ${pot.name}.`,
      },
    });
    return updated;
  }

  async archive(userId: string, potId: string) {
    const pot = await this.prisma.savingsPot.findFirst({ where: { id: potId, userId } });
    if (!pot) throw new NotFoundException('Savings pot not found');
    await this.prisma.savingsPot.update({ where: { id: potId }, data: { archivedAt: new Date() } });
    return { success: true };
  }
}
