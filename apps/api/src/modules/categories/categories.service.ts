import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, includeArchived = false) {
    return this.prisma.category.findMany({
      where: { OR: [{ userId }, { isSystem: true }], ...(includeArchived ? {} : { isArchived: false }) },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  create(userId: string, dto: any) {
    if (!dto.name?.trim()) throw new BadRequestException('Category name is required');
    return this.prisma.category.create({
      data: {
        userId,
        name: dto.name.trim(),
        icon: dto.icon || null,
        color: dto.color || null,
        displayOrder: Number(dto.displayOrder ?? 0),
        categoryType: dto.categoryType === 'INCOME' ? 'INCOME' : 'EXPENSE',
        isSystem: false,
        isArchived: dto.isArchived ?? false,
      },
    });
  }

  async update(userId: string, id: string, dto: any) {
    const found = await this.prisma.category.findFirst({ where: { id, userId, isSystem: false } });
    if (!found) throw new NotFoundException('Category not found');
    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name?.trim() || found.name,
        icon: dto.icon ?? found.icon,
        color: dto.color ?? found.color,
        displayOrder: dto.displayOrder === undefined ? found.displayOrder : Number(dto.displayOrder),
        categoryType: dto.categoryType === 'INCOME' ? 'INCOME' : dto.categoryType === 'EXPENSE' ? 'EXPENSE' : found.categoryType,
        isArchived: dto.isArchived ?? found.isArchived,
      },
    });
  }

  async remove(userId: string, id: string) {
    const found = await this.prisma.category.findFirst({ where: { id, userId, isSystem: false } });
    if (!found) throw new NotFoundException('Category not found');
    await this.prisma.category.update({ where: { id }, data: { isArchived: true } });
    return { success: true };
  }
}
