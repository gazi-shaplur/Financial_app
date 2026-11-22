import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { SettingsService } from './settings.service.js';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  @UseGuards(AuthGuard)
  getUserSettings(@CurrentUser() user: any) {
    return this.settings.userSettings(user.id);
  }

  @Patch()
  @UseGuards(AuthGuard)
  updateUserSettings(@CurrentUser() user: any, @Body() dto: Record<string, unknown>) {
    return this.settings.updateUserSettings(user.id, dto);
  }

  @Get('application/public')
  publicApplicationSettings() {
    return this.settings.applicationSettings();
  }

  @Get('announcements/active')
  activeAnnouncements() {
    return this.settings.activeAnnouncements();
  }
}
