import { Controller, Get, Header, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ReportsService } from './reports.service.js';

@Controller('reports')
@UseGuards(AuthGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('monthly')
  monthly(@CurrentUser() user: any, @Query('year') year: string, @Query('month') month: string) {
    return this.reports.monthly(
      user.id,
      Number(year || new Date().getFullYear()),
      Number(month || new Date().getMonth() + 1),
    );
  }

  @Get('range')
  range(@CurrentUser() user: any, @Query('from') from: string, @Query('to') to: string) {
    return this.reports.incomeExpenseRange(user.id, new Date(from), new Date(to));
  }

  @Get('analytics')
  analytics(@CurrentUser() user: any, @Query('months') months: string) {
    return this.reports.analytics(user.id, Math.min(24, Math.max(1, Number(months || 12))));
  }

  @Get('transactions.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async csv(
    @CurrentUser() user: any,
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() response: Response,
  ) {
    const csv = await this.reports.csv(user.id, from, to);
    response.setHeader('Content-Disposition', 'attachment; filename="budgetbook-transactions.csv"');
    response.send(csv);
  }
}
