import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { TodosService } from './todos.service.js';

@Controller('todos')
@UseGuards(AuthGuard)
export class TodosController {
  constructor(private readonly todos: TodosService) {}

  @Get()
  list(@CurrentUser() user: any, @Query() query: any) {
    return this.todos.list(user.id, query);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.todos.create(user.id, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.todos.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.todos.remove(user.id, id);
  }
}
