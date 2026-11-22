import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(userId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const [transactionIncome, separateIncome, expenses, budget, savings, recent, todos, expenseCategories, monthlyExpenses] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { userId, type: 'INCOME', deletedAt: null, transactionAt: { gte: start, lt: end } },
        _sum: { amount: true },
      }),
      this.prisma.income.aggregate({
        where: { userId, deletedAt: null, incomeAt: { gte: start, lt: end } },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE', deletedAt: null, transactionAt: { gte: start, lt: end } },
        _sum: { amount: true },
      }),
      this.prisma.budget.findUnique({
        where: { userId_month: { userId, month: start } },
      }),
      this.prisma.savingsPot.aggregate({
        where: { userId, archivedAt: null },
        _sum: { currentAmount: true },
      }),
      this.prisma.transaction.findMany({
        where: { userId, deletedAt: null },
        include: { category: true, account: true },
        orderBy: { transactionAt: 'desc' },
        take: 8,
      }),
      this.prisma.todo.count({ where: { userId, deletedAt: null, status: 'PENDING' } }),
      this.prisma.transaction.groupBy({
        by: ['categoryId'],
        where: { userId, type: 'EXPENSE', deletedAt: null, transactionAt: { gte: start, lt: end } },
        _sum: { amount: true },
      }),
      this.prisma.transaction.findMany({
        where: { userId, type: 'EXPENSE', deletedAt: null, transactionAt: { gte: start, lt: end } },
        select: { amount: true, transactionAt: true },
      }),
    ]);

    const income = Number(transactionIncome._sum.amount ?? 0) + Number(separateIncome._sum.amount ?? 0);
    const expense = Number(expenses._sum.amount ?? 0);
    const budgetAmount = Number(budget?.amount ?? 0);
    const categoryIds = expenseCategories.map((entry) => entry.categoryId).filter((id): id is string => Boolean(id));
    const categories = await this.prisma.category.findMany({ where: { id: { in: categoryIds } } });
    const spendingByCategory = expenseCategories.map((entry) => ({
      categoryId: entry.categoryId,
      name: categories.find((category) => category.id === entry.categoryId)?.name ?? 'Uncategorized',
      amount: Number(entry._sum.amount ?? 0),
    }));

    const weeklySpending = Array.from({ length: 5 }, (_, index) => ({
      week: index + 1,
      amount: 0,
    }));
    monthlyExpenses.forEach((entry) => {
      const day = entry.transactionAt.getDate();
      const weekIndex = Math.min(4, Math.floor((day - 1) / 7));
      weeklySpending[weekIndex].amount += Number(entry.amount);
    });
    const utilization = budgetAmount > 0 ? (expense / budgetAmount) * 100 : 0;
    return {
      month: `${year}-${String(month).padStart(2, '0')}`,
      income,
      expense,
      net: income - expense,
      budget: budgetAmount,
      budgetRemaining: budgetAmount - expense,
      savings: Number(savings._sum.currentAmount ?? 0),
      pendingTodos: todos,
      recentTransactions: recent,
      spendingByCategory,
      weeklySpending,
      budgetUtilization: Math.round(utilization * 100) / 100,
      budgetExceeded: budgetAmount > 0 && expense > budgetAmount,
    };
  }
}
