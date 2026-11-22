import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RecurringService } from './recurring.service.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';

@Controller('recurring')
@UseGuards(AuthGuard)
export class RecurringController {
  constructor(private readonly recurring: RecurringService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.recurring.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.recurring.create(user.id, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.recurring.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.recurring.remove(user.id, id);
  }

  @Post(':id/pause')
  pause(@CurrentUser() user: any, @Param('id') id: string) {
    return this.recurring.pause(user.id, id);
  }

  @Post(':id/resume')
  resume(@CurrentUser() user: any, @Param('id') id: string) {
    return this.recurring.resume(user.id, id);
  }

  @Post('process-due')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @UseGuards(RolesGuard)
  processDue() {
    return this.recurring.processDue();
  }
}
