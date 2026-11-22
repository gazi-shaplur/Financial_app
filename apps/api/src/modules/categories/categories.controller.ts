import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { CategoriesService } from './categories.service.js';

@Controller('categories')
@UseGuards(AuthGuard)
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list(@CurrentUser() user: any, @Query('includeArchived') includeArchived: string) {
    return this.categories.list(user.id, includeArchived === 'true');
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.categories.create(user.id, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.categories.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.categories.remove(user.id, id);
  }
}
