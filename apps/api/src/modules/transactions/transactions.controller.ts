import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { CreateAccountDto, CreateIncomeDto, CreateTransactionDto } from './dto.js';
import { TransactionsService } from './transactions.service.js';

@Controller()
@UseGuards(AuthGuard)
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Get('accounts')
  accounts(@CurrentUser() user: any) {
    return this.transactions.accounts(user.id);
  }

  @Post('accounts')
  createAccount(@CurrentUser() user: any, @Body() dto: CreateAccountDto) {
    return this.transactions.createAccount(user.id, dto);
  }

  @Get('transactions')
  list(@CurrentUser() user: any, @Query() query: any) {
    return this.transactions.list(user.id, query);
  }

  @Post('transactions')
  create(@CurrentUser() user: any, @Body() dto: CreateTransactionDto) {
    return this.transactions.create(user.id, dto);
  }

  @Patch('transactions/:id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.transactions.update(user.id, id, dto);
  }

  @Delete('transactions/:id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.transactions.remove(user.id, id);
  }

  @Get('income')
  listIncome(@CurrentUser() user: any, @Query() query: any) {
    return this.transactions.listIncome(user.id, query);
  }

  @Post('income')
  createIncome(@CurrentUser() user: any, @Body() dto: CreateIncomeDto) {
    return this.transactions.createIncome(user.id, dto);
  }

  @Patch('income/:id')
  updateIncome(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.transactions.updateIncome(user.id, id, dto);
  }

  @Delete('income/:id')
  removeIncome(@CurrentUser() user: any, @Param('id') id: string) {
    return this.transactions.removeIncome(user.id, id);
  }
}
