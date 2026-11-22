import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async monthly(userId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const [income, expense, categoryExpense] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { userId, type: 'INCOME', deletedAt: null, transactionAt: { gte: start, lt: end } },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE', deletedAt: null, transactionAt: { gte: start, lt: end } },
        _sum: { amount: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['categoryId'],
        where: { userId, type: 'EXPENSE', deletedAt: null, transactionAt: { gte: start, lt: end } },
        _sum: { amount: true },
      }),
    ]);
    const categoryIds = categoryExpense.map((entry) => entry.categoryId).filter((id): id is string => Boolean(id));
    const categories = await this.prisma.category.findMany({ where: { id: { in: categoryIds } } });
    const byCategory = categoryExpense.map((entry) => ({
      categoryId: entry.categoryId,
      name: categories.find((category) => category.id === entry.categoryId)?.name ?? 'Uncategorized',
      amount: Number(entry._sum.amount ?? 0),
    }));
    const incomeTotal = Number(income._sum.amount ?? 0);
    const expenseTotal = Number(expense._sum.amount ?? 0);
    return {
      period: `${year}-${String(month).padStart(2, '0')}`,
      income: incomeTotal,
      expenses: expenseTotal,
      net: incomeTotal - expenseTotal,
      byCategory,
    };
  }

  async incomeExpenseRange(userId: string, from: Date, to: Date) {
    const [income, expense] = await Promise.all([
      this.prisma.transaction.aggregate({ where: { userId, type: 'INCOME', deletedAt: null, transactionAt: { gte: from, lt: to } }, _sum: { amount: true } }),
      this.prisma.transaction.aggregate({ where: { userId, type: 'EXPENSE', deletedAt: null, transactionAt: { gte: from, lt: to } }, _sum: { amount: true } }),
    ]);
    return { from, to, income: Number(income._sum.amount ?? 0), expenses: Number(expense._sum.amount ?? 0) };
  }

  async analytics(userId: string, months = 12) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    const [transactions, separateIncome, savings] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId, deletedAt: null, transactionAt: { gte: start, lt: new Date(now.getFullYear(), now.getMonth() + 1, 1) } },
        include: { category: true },
      }),
      this.prisma.income.findMany({ where: { userId, deletedAt: null, incomeAt: { gte: start } } }),
      this.prisma.savingsPot.findMany({ where: { userId, archivedAt: null }, include: { transactions: true } }),
    ]);
    const trends = new Map<string, { month: string; income: number; expenses: number }>();
    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1);
      trends.set(date.toISOString().slice(0, 7), { month: date.toISOString().slice(0, 7), income: 0, expenses: 0 });
    }
    transactions.forEach((transaction) => {
      const key = transaction.transactionAt.toISOString().slice(0, 7);
      const trend = trends.get(key);
      if (!trend) return;
      if (transaction.type === 'INCOME') trend.income += Number(transaction.amount);
      if (transaction.type === 'EXPENSE') trend.expenses += Number(transaction.amount);
    });
    separateIncome.forEach((income) => {
      const key = income.incomeAt.toISOString().slice(0, 7);
      const trend = trends.get(key);
      if (trend) trend.income += Number(income.amount);
    });
    const categoryMap = new Map<string, number>();
    transactions.filter((item) => item.type === 'EXPENSE').forEach((item) => {
      const name = item.category?.name ?? 'Uncategorized';
      categoryMap.set(name, (categoryMap.get(name) ?? 0) + Number(item.amount));
    });
    const savingsTrend = trends ? Array.from(trends.values()).map((entry) => ({ month: entry.month, savings: 0 })) : [];
    savings.forEach((pot) => pot.transactions.forEach((entry) => {
      const key = entry.occurredAt.toISOString().slice(0, 7);
      const row = savingsTrend.find((item) => item.month === key);
      if (row) row.savings += entry.type === 'DEPOSIT' ? Number(entry.amount) : -Number(entry.amount);
    }));
    return {
      incomeVsExpenses: Array.from(trends.values()),
      categorySpending: Array.from(categoryMap, ([category, amount]) => ({ category, amount })),
      savingsTrend,
      totalSavings: savings.reduce((sum, pot) => sum + Number(pot.currentAmount), 0),
    };
  }

  async csv(userId: string, from?: string, to?: string) {
    const where: any = { userId, deletedAt: null };
    if (from || to) {
      where.transactionAt = {};
      if (from) where.transactionAt.gte = new Date(from);
      if (to) where.transactionAt.lte = new Date(to);
    }
    const transactions = await this.prisma.transaction.findMany({
      where,
      include: { account: true, category: true },
      orderBy: { transactionAt: 'desc' },
    });
    const escape = (value: unknown) => {
      let text = String(value ?? '');
      if (/^[=+\-@]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    };
    const header = ['Date','Type','Category','Account','Merchant','Description','Payment Method','Amount','Currency'].join(',');
    const rows = transactions.map((item) => [
      item.transactionAt.toISOString(), item.type, item.category?.name ?? '',
      item.account.name, item.merchant, item.description, item.paymentMethod,
      item.amount.toString(), item.currencyCode,
    ].map(escape).join(','));
    return [header, ...rows].join('\r\n');
  }
}
