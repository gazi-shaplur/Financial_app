import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [
      users,
      activeUsers,
      suspendedUsers,
      transactions,
      incomeRecords,
      expenseRecords,
      savings,
      auditLogs,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      this.prisma.user.count({ where: { status: 'SUSPENDED', deletedAt: null } }),
      this.prisma.transaction.count({ where: { deletedAt: null } }),
      this.prisma.income.count({ where: { deletedAt: null } }),
      this.prisma.transaction.count({ where: { type: 'EXPENSE', deletedAt: null } }),
      this.prisma.savingsPot.aggregate({ where: { archivedAt: null }, _sum: { currentAmount: true } }),
      this.prisma.auditLog.count(),
    ]);
    const now = new Date();
    const trendStart = new Date(now);
    trendStart.setUTCDate(trendStart.getUTCDate() - 29);
    trendStart.setUTCHours(0, 0, 0, 0);
    const registrations = await this.prisma.user.findMany({
      where: { deletedAt: null, createdAt: { gte: trendStart } },
      select: { createdAt: true },
    });
    const registrationTrend = new Map<string, number>();
    registrations.forEach((user) => {
      const key = user.createdAt.toISOString().slice(0, 10);
      registrationTrend.set(key, (registrationTrend.get(key) ?? 0) + 1);
    });
    return {
      users,
      activeUsers,
      suspendedUsers,
      transactions,
      incomeRecords,
      expenseRecords,
      savingsBalance: Number(savings._sum.currentAmount ?? 0),
      auditLogs,
      registrationTrend: Array.from(registrationTrend, ([date, count]) => ({ date, count })),
    };
  }

  listSettings() {
    return this.prisma.applicationSetting.findMany({ orderBy: { key: 'asc' } });
  }

  async upsertSetting(adminId: string, dto: { key: string; value: unknown; description?: string; isPublic?: boolean }) {
    const setting = await this.prisma.applicationSetting.upsert({
      where: { key: dto.key },
      update: { value: dto.value as any, description: dto.description, isPublic: dto.isPublic ?? false },
      create: { key: dto.key, value: dto.value as any, description: dto.description, isPublic: dto.isPublic ?? false },
    });
    await this.prisma.auditLog.create({
      data: { actorId: adminId, action: 'UPSERT_SETTING', entityType: 'APPLICATION_SETTING', entityId: setting.id, metadata: { key: dto.key } },
    });
    return setting;
  }

  auditLogs(page = 1, pageSize = 50) {
    return this.prisma.auditLog.findMany({
      include: { actor: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async deleteSetting(adminId: string, id: string) {
    const setting = await this.prisma.applicationSetting.findUnique({ where: { id } });
    if (!setting) throw new NotFoundException('Setting not found');
    await this.prisma.applicationSetting.delete({ where: { id } });
    await this.prisma.auditLog.create({
      data: { actorId: adminId, action: 'DELETE_SETTING', entityType: 'APPLICATION_SETTING', entityId: id, metadata: { key: setting.key } },
    });
    return { success: true };
  }

  async userDetail(adminId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        sessions: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!user || user.deletedAt) throw new NotFoundException('User not found');
    const { passwordHash, ...safe } = user;
    const activity = await this.prisma.auditLog.findMany({
      where: { OR: [{ actorId: userId }, { targetId: userId }] },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return { ...safe, roles: user.roles.map((entry) => entry.role.name), activity };
  }

  async updateUserRole(adminId: string, userId: string, roleNames: string[]) {
    if (!roleNames.length) throw new BadRequestException('At least one role is required');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) throw new NotFoundException('User not found');
    if (adminId === userId) throw new BadRequestException('You cannot modify your own roles');
    const roles = await this.prisma.role.findMany({ where: { name: { in: roleNames as any } } });
    if (roles.length !== roleNames.length) throw new BadRequestException('One or more roles are invalid');
    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId } }),
      this.prisma.userRole.createMany({ data: roles.map((role) => ({ userId, roleId: role.id })) }),
    ]);
    await this.prisma.auditLog.create({
      data: { actorId: adminId, targetId: userId, action: 'UPDATE_ROLES', entityType: 'USER', entityId: userId, metadata: { roles: roleNames } },
    });
    return { id: userId, roles: roleNames };
  }

  async softDeleteUser(adminId: string, userId: string) {
    if (adminId === userId) throw new BadRequestException('You cannot delete your own account');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) throw new NotFoundException('User not found');
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date(), status: 'SUSPENDED' } }),
      this.prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    await this.prisma.auditLog.create({
      data: { actorId: adminId, targetId: userId, action: 'DELETE_USER', entityType: 'USER', entityId: userId },
    });
    return { success: true };
  }

  listRoles() {
    return this.prisma.role.findMany({
      include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createRole(adminId: string, dto: { name: string; description?: string }) {
    const name = dto.name.trim().toUpperCase().replace(/\s+/g, '_');
    if (!name) throw new BadRequestException('Role name is required');
    const role = await this.prisma.role.create({ data: { name: name as any, description: dto.description } }).catch(() => null);
    if (!role) throw new BadRequestException('Role already exists or is invalid');
    await this.prisma.auditLog.create({
      data: { actorId: adminId, action: 'CREATE_ROLE', entityType: 'ROLE', entityId: role.id, metadata: { name } },
    });
    return role;
  }

  listPermissions() {
    return this.prisma.permission.findMany({ include: { roles: { include: { role: true } } }, orderBy: { key: 'asc' } });
  }

  async setRolePermissions(adminId: string, roleId: string, permissionKeys: string[]) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');
    const permissions = await this.prisma.permission.findMany({ where: { key: { in: permissionKeys } } });
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({ data: permissions.map((permission) => ({ roleId, permissionId: permission.id })) }),
    ]);
    await this.prisma.auditLog.create({
      data: { actorId: adminId, action: 'UPDATE_ROLE_PERMISSIONS', entityType: 'ROLE', entityId: roleId, metadata: { permissions: permissionKeys } },
    });
    return { id: roleId, permissionKeys };
  }

  listCategories(includeArchived = false) {
    return this.prisma.category.findMany({
      where: includeArchived ? { isSystem: true } : { isSystem: true, isArchived: false },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async upsertCategory(adminId: string, dto: any, id?: string) {
    if (!dto.name?.trim()) throw new BadRequestException('Category name is required');
    const data = {
      name: dto.name.trim(),
      icon: dto.icon || null,
      color: dto.color || null,
      displayOrder: Number(dto.displayOrder ?? 0),
      categoryType: dto.categoryType || 'EXPENSE',
      isArchived: dto.isArchived ?? false,
      isSystem: true,
    };
    const category = id
      ? await this.prisma.category.update({ where: { id }, data })
      : await this.prisma.category.create({ data });
    await this.prisma.auditLog.create({
      data: { actorId: adminId, action: id ? 'UPDATE_CATEGORY' : 'CREATE_CATEGORY', entityType: 'CATEGORY', entityId: category.id, metadata: data },
    });
    return category;
  }

  async deleteCategory(adminId: string, id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category || !category.isSystem) throw new NotFoundException('System category not found');
    await this.prisma.category.update({ where: { id }, data: { isArchived: true } });
    await this.prisma.auditLog.create({
      data: { actorId: adminId, action: 'DELETE_CATEGORY', entityType: 'CATEGORY', entityId: id },
    });
    return { success: true };
  }

  listAnnouncements() {
    return this.prisma.announcement.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } });
  }

  async upsertAnnouncement(adminId: string, dto: any, id?: string) {
    if (!dto.title?.trim() || !dto.message?.trim()) throw new BadRequestException('Title and message are required');
    const data = {
      title: dto.title.trim(),
      message: dto.message.trim(),
      link: dto.link || null,
      severity: dto.severity || 'INFO',
      isActive: dto.isActive ?? true,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : new Date(),
      endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
    };
    const announcement = id
      ? await this.prisma.announcement.update({ where: { id }, data })
      : await this.prisma.announcement.create({ data });
    await this.prisma.auditLog.create({
      data: { actorId: adminId, action: id ? 'UPDATE_ANNOUNCEMENT' : 'CREATE_ANNOUNCEMENT', entityType: 'ANNOUNCEMENT', entityId: announcement.id },
    });
    return announcement;
  }

  async deleteAnnouncement(adminId: string, id: string) {
    await this.prisma.announcement.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    await this.prisma.auditLog.create({
      data: { actorId: adminId, action: 'DELETE_ANNOUNCEMENT', entityType: 'ANNOUNCEMENT', entityId: id },
    });
    return { success: true };
  }

  listTemplates() {
    return this.prisma.notificationTemplate.findMany({ orderBy: { key: 'asc' } });
  }

  async upsertTemplate(adminId: string, dto: any, id?: string) {
    const data = { key: dto.key.trim(), title: dto.title.trim(), message: dto.message.trim(), isActive: dto.isActive ?? true };
    const template = id
      ? await this.prisma.notificationTemplate.update({ where: { id }, data })
      : await this.prisma.notificationTemplate.create({ data });
    await this.prisma.auditLog.create({
      data: { actorId: adminId, action: id ? 'UPDATE_TEMPLATE' : 'CREATE_TEMPLATE', entityType: 'NOTIFICATION_TEMPLATE', entityId: template.id },
    });
    return template;
  }
}
