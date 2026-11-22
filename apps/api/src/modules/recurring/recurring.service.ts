import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class RecurringService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.processDue();
  }

  private nextRun(date: Date, frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY') {
    const next = new Date(date);
    if (frequency === 'DAILY') next.setUTCDate(next.getUTCDate() + 1);
    if (frequency === 'WEEKLY') next.setUTCDate(next.getUTCDate() + 7);
    if (frequency === 'MONTHLY') next.setUTCMonth(next.getUTCMonth() + 1);
    if (frequency === 'YEARLY') next.setUTCFullYear(next.getUTCFullYear() + 1);
    return next;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async scheduledRun() {
    await this.processDue();
  }

  async processDue() {
    const due = await this.prisma.recurringTransaction.findMany({
      where: { isActive: true, deletedAt: null, nextRunAt: { lte: new Date() } },
    });
    let generated = 0;
    for (const rule of due) {
      if (!rule.accountId) continue;
      await this.prisma.$transaction(async (tx) => {
        await tx.transaction.create({
          data: {
            userId: rule.userId,
            accountId: rule.accountId!,
            categoryId: rule.categoryId,
            type: rule.type,
            amount: rule.amount,
            currencyCode: rule.currencyCode,
            transactionAt: new Date(rule.nextRunAt),
            description: rule.description,
          },
        });
        await tx.recurringTransaction.update({
          where: { id: rule.id },
          data: {
            lastRunAt: new Date(),
            nextRunAt: this.nextRun(rule.nextRunAt, rule.frequency),
          },
        });
      });
      await this.prisma.notification.create({
        data: {
          userId: rule.userId,
          type: 'SYSTEM',
          title: 'Recurring transaction generated',
          message: `${rule.description || rule.type.toLowerCase()} for ${rule.amount} ${rule.currencyCode} was added.`,
        },
      });
      generated++;
    }
    return { generated };
  }

  list(userId: string) {
    return this.prisma.recurringTransaction.findMany({
      where: { userId, deletedAt: null },
      orderBy: { nextRunAt: 'asc' },
    });
  }

  async create(userId: string, dto: any) {
    if (Number(dto.amount) <= 0) throw new BadRequestException('Amount must be greater than zero');
    if (!dto.accountId) throw new BadRequestException('An account is required');
    const account = await this.prisma.account.findFirst({ where: { id: dto.accountId, userId, isArchived: false } });
    if (!account) throw new BadRequestException('Account is invalid');
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({ where: { id: dto.categoryId, OR: [{ userId }, { isSystem: true }] } });
      if (!category) throw new BadRequestException('Category is invalid');
    }
    return this.prisma.recurringTransaction.create({
      data: {
        userId,
        accountId: dto.accountId,
        categoryId: dto.categoryId,
        type: dto.type,
        amount: dto.amount,
        currencyCode: dto.currencyCode,
        description: dto.description,
        frequency: dto.frequency,
        nextRunAt: new Date(dto.nextRunAt),
      },
    });
  }

  async update(userId: string, id: string, dto: any) {
    const found = await this.prisma.recurringTransaction.findFirst({ where: { id, userId, deletedAt: null } });
    if (!found) throw new NotFoundException('Recurring transaction not found');
    if (dto.accountId) {
      const account = await this.prisma.account.findFirst({ where: { id: dto.accountId, userId, isArchived: false } });
      if (!account) throw new BadRequestException('Account is invalid');
    }
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({ where: { id: dto.categoryId, OR: [{ userId }, { isSystem: true }] } });
      if (!category) throw new BadRequestException('Category is invalid');
    }
    if (dto.amount !== undefined && Number(dto.amount) <= 0) throw new BadRequestException('Amount must be greater than zero');
    return this.prisma.recurringTransaction.update({
      where: { id },
      data: {
        accountId: dto.accountId ?? found.accountId,
        categoryId: dto.categoryId === null ? null : dto.categoryId ?? found.categoryId,
        type: dto.type ?? found.type,
        amount: dto.amount ?? found.amount,
        currencyCode: dto.currencyCode ?? found.currencyCode,
        description: dto.description ?? found.description,
        frequency: dto.frequency ?? found.frequency,
        nextRunAt: dto.nextRunAt ? new Date(dto.nextRunAt) : found.nextRunAt,
      },
    });
  }

  async remove(userId: string, id: string) {
    const found = await this.prisma.recurringTransaction.findFirst({ where: { id, userId, deletedAt: null } });
    if (!found) throw new NotFoundException('Recurring transaction not found');
    await this.prisma.recurringTransaction.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  async pause(userId: string, id: string) {
    const found = await this.prisma.recurringTransaction.findFirst({ where: { id, userId, deletedAt: null } });
    if (!found) throw new NotFoundException('Recurring transaction not found');
    return this.prisma.recurringTransaction.update({ where: { id }, data: { isActive: false } });
  }

  async resume(userId: string, id: string) {
    const found = await this.prisma.recurringTransaction.findFirst({ where: { id, userId, deletedAt: null } });
    if (!found) throw new NotFoundException('Recurring transaction not found');
    return this.prisma.recurringTransaction.update({ where: { id }, data: { isActive: true, nextRunAt: found.nextRunAt < new Date() ? new Date() : found.nextRunAt } });
  }
}
