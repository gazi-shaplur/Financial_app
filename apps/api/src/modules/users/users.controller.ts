import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UpdateProfileDto } from '../auth/dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  profile(@CurrentUser() user: any) {
    return this.users.profile(user.id);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @Get('me/sessions')
  sessions(@CurrentUser() user: any) {
    return this.users.sessions(user.id);
  }

  @Patch('me/sessions/:sessionId/revoke')
  revokeSession(@CurrentUser() user: any, @Param('sessionId') sessionId: string) {
    return this.users.revokeSession(user.id, sessionId);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @UseGuards(RolesGuard)
  listUsers(@Query() query: any) {
    return this.users.listUsers(query);
  }

  @Patch(':userId/status')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @UseGuards(RolesGuard)
  updateStatus(@CurrentUser() admin: any, @Param('userId') userId: string, @Body() body: { status: string }) {
    return this.users.updateUserStatus(admin.id, userId, body.status);
  }
}
