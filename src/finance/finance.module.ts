import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { DailySummaryModule } from '../monitoring/daily-summary/daily-summary.module';
import { MonthlySummaryModule } from '../monitoring/monthly-summary/monthly-summary.module';

@Module({
  imports: [DailySummaryModule, MonthlySummaryModule],
  controllers: [FinanceController],
})
export class FinanceModule {}
