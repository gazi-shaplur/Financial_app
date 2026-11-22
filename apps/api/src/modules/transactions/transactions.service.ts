import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async accounts(userId: string) {
    return this.prisma.account.findMany({
      where: { userId, isArchived: false },
      orderBy: { name: 'asc' },
    });
  }

  async createAccount(userId: string, dto: any) {
    return this.prisma.account.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        currencyCode: dto.currencyCode,
        openingBalance: dto.openingBalance ?? '0',
      },
    });
  }

  async list(userId: string, query: any) {
    const page = Math.max(1, Number(query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize || 20)));
    const where: any = { userId, deletedAt: null };
    if (query.type) where.type = query.type;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.search) {
      where.OR = [
        { merchant: { contains: String(query.search), mode: 'insensitive' } },
        { description: { contains: String(query.search), mode: 'insensitive' } },
      ];
    }
    if (query.month && query.year) {
      const start = new Date(Number(query.year), Number(query.month) - 1, 1);
      const end = new Date(Number(query.year), Number(query.month), 1);
      where.transactionAt = { gte: start, lt: end };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        include: { account: true, category: true },
        orderBy: query.sort === 'amount' ? { amount: query.order === 'asc' ? 'asc' : 'desc' } : { transactionAt: query.order === 'asc' ? 'asc' : 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.transaction.count({ where }),
    ]);
    return { items, page, pageSize, total };
  }

  async create(userId: string, dto: any) {
    if (Number(dto.amount) <= 0) throw new BadRequestException('Amount must be greater than zero');
    const account = await this.prisma.account.findFirst({ where: { id: dto.accountId, userId, isArchived: false } });
    if (!account) throw new BadRequestException('Account is invalid');
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({ where: { id: dto.categoryId, OR: [{ userId }, { isSystem: true }] } });
      if (!category) throw new BadRequestException('Category is invalid');
    }
    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        accountId: dto.accountId,
        categoryId: dto.categoryId,
        type: dto.type,
        amount: dto.amount,
        currencyCode: dto.currencyCode,
        transactionAt: new Date(dto.transactionAt),
        merchant: dto.merchant,
        description: dto.description,
        paymentMethod: dto.paymentMethod,
      },
    });
    if (dto.type === 'EXPENSE') {
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'SYSTEM',
          title: 'Expense recorded',
          message: `An expense of ${dto.amount} ${dto.currencyCode} was added.`,
        },
      });
    }
    return transaction;
  }

  async update(userId: string, id: string, dto: any) {
    const found = await this.prisma.transaction.findFirst({ where: { id, userId, deletedAt: null } });
    if (!found) throw new NotFoundException('Transaction not found');
    if (dto.accountId) {
      const account = await this.prisma.account.findFirst({ where: { id: dto.accountId, userId, isArchived: false } });
      if (!account) throw new BadRequestException('Account is invalid');
    }
    if (dto.amount !== undefined && Number(dto.amount) <= 0) throw new BadRequestException('Amount must be greater than zero');
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({ where: { id: dto.categoryId, OR: [{ userId }, { isSystem: true }] } });
      if (!category) throw new BadRequestException('Category is invalid');
    }
    return this.prisma.transaction.update({
      where: { id },
      data: {
        accountId: dto.accountId ?? found.accountId,
        categoryId: dto.categoryId === null ? null : dto.categoryId ?? found.categoryId,
        type: dto.type ?? found.type,
        amount: dto.amount ?? found.amount,
        currencyCode: dto.currencyCode ?? found.currencyCode,
        merchant: dto.merchant ?? found.merchant,
        description: dto.description ?? found.description,
        paymentMethod: dto.paymentMethod ?? found.paymentMethod,
        transactionAt: dto.transactionAt ? new Date(dto.transactionAt) : undefined,
      },
    });
  }

  async remove(userId: string, id: string) {
    const found = await this.prisma.transaction.findFirst({ where: { id, userId, deletedAt: null } });
    if (!found) throw new NotFoundException('Transaction not found');
    await this.prisma.transaction.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  async listIncome(userId: string, query: any) {
    const page = Math.max(1, Number(query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize || 20)));
    const where: any = { userId, deletedAt: null };
    if (query.month && query.year) {
      const start = new Date(Number(query.year), Number(query.month) - 1, 1);
      const end = new Date(Number(query.year), Number(query.month), 1);
      where.incomeAt = { gte: start, lt: end };
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.income.findMany({ where, orderBy: { incomeAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.income.count({ where }),
    ]);
    return { items, page, pageSize, total };
  }

  createIncome(userId: string, dto: any) {
    if (Number(dto.amount) <= 0) throw new BadRequestException('Income amount must be greater than zero');
    return this.prisma.income.create({
      data: {
        userId,
        accountId: dto.accountId,
        name: dto.name,
        amount: dto.amount,
        currencyCode: dto.currencyCode,
        incomeAt: new Date(dto.incomeAt),
        source: dto.source,
        description: dto.description,
      },
    });
  }

  async updateIncome(userId: string, id: string, dto: any) {
    const found = await this.prisma.income.findFirst({ where: { id, userId, deletedAt: null } });
    if (!found) throw new NotFoundException('Income record not found');
    if (dto.amount !== undefined && Number(dto.amount) < 0) throw new BadRequestException('Income amount cannot be negative');
    return this.prisma.income.update({
      where: { id },
      data: {
        accountId: dto.accountId ?? found.accountId,
        name: dto.name ?? found.name,
        amount: dto.amount ?? found.amount,
        currencyCode: dto.currencyCode ?? found.currencyCode,
        source: dto.source ?? found.source,
        description: dto.description ?? found.description,
        incomeAt: dto.incomeAt ? new Date(dto.incomeAt) : undefined,
      },
    });
  }

  async removeIncome(userId: string, id: string) {
    const found = await this.prisma.income.findFirst({ where: { id, userId, deletedAt: null } });
    if (!found) throw new NotFoundException('Income record not found');
    await this.prisma.income.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }
}
