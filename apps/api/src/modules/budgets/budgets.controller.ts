import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BudgetsService } from './budgets.service.js';

@Controller('budgets')
@UseGuards(AuthGuard)
export class BudgetsController {
  constructor(private readonly budgets: BudgetsService) {}

  @Get()
  getMonth(@CurrentUser() user: any, @Query('year') year: string, @Query('month') month: string) {
    return this.budgets.getMonth(user.id, Number(year || new Date().getFullYear()), Number(month || new Date().getMonth() + 1));
  }

  @Put()
  upsert(@CurrentUser() user: any, @Body() dto: any) {
    return this.budgets.upsert(user.id, dto);
  }

  @Get('progress')
  progress(@CurrentUser() user: any, @Query('year') year: string, @Query('month') month: string) {
    return this.budgets.progress(user.id, Number(year || new Date().getFullYear()), Number(month || new Date().getMonth() + 1));
  }
}
