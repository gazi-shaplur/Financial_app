import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { TransactionsModule } from './modules/transactions/transactions.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { BudgetsModule } from './modules/budgets/budgets.module.js';
import { SavingsModule } from './modules/savings/savings.module.js';
import { TodosModule } from './modules/todos/todos.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { SettingsModule } from './modules/settings/settings.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { RecurringModule } from './modules/recurring/recurring.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';
import { AdminModule } from './modules/admin/admin.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    AuthModule,
    UsersModule,
    TransactionsModule,
    CategoriesModule,
    BudgetsModule,
    SavingsModule,
    TodosModule,
    DashboardModule,
    SettingsModule,
    NotificationsModule,
    RecurringModule,
    ReportsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
