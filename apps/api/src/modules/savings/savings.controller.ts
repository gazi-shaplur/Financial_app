import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { SavingsService } from './savings.service.js';

@Controller('savings')
@UseGuards(AuthGuard)
export class SavingsController {
  constructor(private readonly savings: SavingsService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.savings.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.savings.create(user.id, dto);
  }

  @Post(':id/deposit')
  deposit(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: { amount: string }) {
    return this.savings.adjust(user.id, id, dto.amount, 'DEPOSIT');
  }

  @Post(':id/withdraw')
  withdraw(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: { amount: string }) {
    return this.savings.adjust(user.id, id, dto.amount, 'WITHDRAW');
  }

  @Delete(':id')
  archive(@CurrentUser() user: any, @Param('id') id: string) {
    return this.savings.archive(user.id, id);
  }
}
