import { Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { NotificationsService } from './notifications.service.js';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.notifications.list(user.id);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notifications.markRead(user.id, id);
  }

  @Post('refresh-upcoming')
  refreshUpcoming(@CurrentUser() user: any) {
    return this.notifications.refreshUpcoming(user.id);
  }
}
