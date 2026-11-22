import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AdminService } from './admin.service.js';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('overview')
  overview() {
    return this.admin.overview();
  }

  @Get('settings')
  settings() {
    return this.admin.listSettings();
  }

  @Post('settings')
  upsertSetting(@CurrentUser() admin: any, @Body() dto: { key: string; value: unknown; description?: string; isPublic?: boolean }) {
    return this.admin.upsertSetting(admin.id, dto);
  }

  @Delete('settings/:id')
  deleteSetting(@CurrentUser() admin: any, @Param('id') id: string) {
    return this.admin.deleteSetting(admin.id, id);
  }

  @Get('audit-logs')
  auditLogs(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return this.admin.auditLogs(Number(page || 1), Math.min(100, Number(pageSize || 50)));
  }

  @Get('users/:userId')
  userDetail(@CurrentUser() admin: any, @Param('userId') userId: string) {
    return this.admin.userDetail(admin.id, userId);
  }

  @Put('users/:userId/roles')
  updateUserRoles(@CurrentUser() admin: any, @Param('userId') userId: string, @Body() dto: { roles: string[] }) {
    return this.admin.updateUserRole(admin.id, userId, dto.roles);
  }

  @Delete('users/:userId')
  deleteUser(@CurrentUser() admin: any, @Param('userId') userId: string) {
    return this.admin.softDeleteUser(admin.id, userId);
  }

  @Get('roles')
  roles() {
    return this.admin.listRoles();
  }

  @Post('roles')
  createRole(@CurrentUser() admin: any, @Body() dto: { name: string; description?: string }) {
    return this.admin.createRole(admin.id, dto);
  }

  @Get('permissions')
  permissions() {
    return this.admin.listPermissions();
  }

  @Put('roles/:roleId/permissions')
  setRolePermissions(@CurrentUser() admin: any, @Param('roleId') roleId: string, @Body() dto: { permissions: string[] }) {
    return this.admin.setRolePermissions(admin.id, roleId, dto.permissions);
  }

  @Get('categories')
  categories(@Query('includeArchived') includeArchived: string) {
    return this.admin.listCategories(includeArchived === 'true');
  }

  @Post('categories')
  createCategory(@CurrentUser() admin: any, @Body() dto: any) {
    return this.admin.upsertCategory(admin.id, dto);
  }

  @Patch('categories/:id')
  updateCategory(@CurrentUser() admin: any, @Param('id') id: string, @Body() dto: any) {
    return this.admin.upsertCategory(admin.id, dto, id);
  }

  @Delete('categories/:id')
  deleteCategory(@CurrentUser() admin: any, @Param('id') id: string) {
    return this.admin.deleteCategory(admin.id, id);
  }

  @Get('announcements')
  announcements() {
    return this.admin.listAnnouncements();
  }

  @Post('announcements')
  createAnnouncement(@CurrentUser() admin: any, @Body() dto: any) {
    return this.admin.upsertAnnouncement(admin.id, dto);
  }

  @Patch('announcements/:id')
  updateAnnouncement(@CurrentUser() admin: any, @Param('id') id: string, @Body() dto: any) {
    return this.admin.upsertAnnouncement(admin.id, dto, id);
  }

  @Delete('announcements/:id')
  deleteAnnouncement(@CurrentUser() admin: any, @Param('id') id: string) {
    return this.admin.deleteAnnouncement(admin.id, id);
  }

  @Get('notification-templates')
  notificationTemplates() {
    return this.admin.listTemplates();
  }

  @Post('notification-templates')
  createTemplate(@CurrentUser() admin: any, @Body() dto: any) {
    return this.admin.upsertTemplate(admin.id, dto);
  }

  @Patch('notification-templates/:id')
  updateTemplate(@CurrentUser() admin: any, @Param('id') id: string, @Body() dto: any) {
    return this.admin.upsertTemplate(admin.id, dto, id);
  }
}
