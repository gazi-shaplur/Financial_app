import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMonth(userId: string, year: number, month: number) {
    const monthDate = new Date(year, month - 1, 1);
    return this.prisma.budget.findUnique({
      where: { userId_month: { userId, month: monthDate } },
      include: { categories: { include: { category: true } } },
    });
  }

  async upsert(userId: string, dto: any) {
    if (Number(dto.amount) < 0) throw new BadRequestException('Budget cannot be negative');
    const monthDate = new Date(Number(dto.year), Number(dto.month) - 1, 1);
    const budget = await this.prisma.budget.upsert({
      where: { userId_month: { userId, month: monthDate } },
      update: { amount: dto.amount, currencyCode: dto.currencyCode, rollover: Boolean(dto.rollover) },
      create: { userId, month: monthDate, amount: dto.amount, currencyCode: dto.currencyCode, rollover: Boolean(dto.rollover) },
    });
    await this.prisma.budgetCategory.deleteMany({ where: { budgetId: budget.id } });
    if (Array.isArray(dto.categories) && dto.categories.length) {
      await this.prisma.budgetCategory.createMany({
        data: dto.categories.map((entry: any) => ({ budgetId: budget.id, categoryId: entry.categoryId, amount: entry.amount })),
      });
    }
    const saved = await this.prisma.budget.findUnique({ where: { id: budget.id }, include: { categories: { include: { category: true } } } });
    const progress = await this.progress(userId, Number(dto.year), Number(dto.month));
    if (progress.remaining < 0) {
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'BUDGET',
          title: 'Budget limit exceeded',
          message: `Your ${dto.year}-${String(dto.month).padStart(2, '0')} budget is exceeded by ${Math.abs(progress.remaining).toFixed(2)}.`,
        },
      });
    }
    return saved;
  }

  async progress(userId: string, year: number, month: number) {
    const budget = await this.getMonth(userId, year, month);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const expenseCategories = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type: 'EXPENSE', deletedAt: null, transactionAt: { gte: start, lt: end } },
      _sum: { amount: true },
    });
    const spent = Object.fromEntries(expenseCategories.map((entry) => [entry.categoryId, Number(entry._sum.amount ?? 0)]));
    const categories = (budget?.categories ?? []).map((entry) => ({
      categoryId: entry.categoryId,
      name: entry.category.name,
      allocated: Number(entry.amount),
      spent: spent[entry.categoryId] ?? 0,
      remaining: Number(entry.amount) - (spent[entry.categoryId] ?? 0),
    }));
    const totalSpent = Object.values(spent).reduce<number>(
      (sum, value) => sum + (typeof value === 'number' ? value : 0),
      0,
    );
    const total = Number(budget?.amount ?? 0);
    return { month: `${year}-${String(month).padStart(2, '0')}`, total, spent: totalSpent, remaining: total - totalSpent, categories };
  }
}
