import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { DashboardService } from './dashboard.service.js';

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  overview(@CurrentUser() user: any, @Query('year') year: string, @Query('month') month: string) {
    return this.dashboard.overview(
      user.id,
      Number(year || new Date().getFullYear()),
      Number(month || new Date().getMonth() + 1),
    );
  }
}
