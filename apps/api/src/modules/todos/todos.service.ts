import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class TodosService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, query: any) {
    const page = Math.max(1, Number(query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize || 20)));
    const where: any = { userId, deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.search) where.title = { contains: String(query.search), mode: 'insensitive' };
    return this.prisma.todo.findMany({
      where,
      orderBy: query.sort === 'dueAt' ? { dueAt: 'asc' } : { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  create(userId: string, dto: any) {
    return this.prisma.todo.create({
      data: { userId, title: dto.title, description: dto.description, priority: dto.priority ?? 'MEDIUM', dueAt: dto.dueAt ? new Date(dto.dueAt) : null, amount: dto.amount === '' || dto.amount === undefined ? null : dto.amount },
    });
  }

  async update(userId: string, id: string, dto: any) {
    const found = await this.prisma.todo.findFirst({ where: { id, userId, deletedAt: null } });
    if (!found) throw new NotFoundException('To-do not found');
    return this.prisma.todo.update({
      where: { id },
      data: {
        title: dto.title ?? found.title,
        description: dto.description ?? found.description,
        status: dto.status ?? found.status,
        priority: dto.priority ?? found.priority,
        amount: dto.amount === '' ? null : dto.amount ?? found.amount,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : found.dueAt,
        completedAt: dto.status === 'COMPLETED' ? new Date() : dto.status === 'PENDING' ? null : found.completedAt,
      },
    });
  }

  async remove(userId: string, id: string) {
    const found = await this.prisma.todo.findFirst({ where: { id, userId, deletedAt: null } });
    if (!found) throw new NotFoundException('To-do not found');
    await this.prisma.todo.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }
}
