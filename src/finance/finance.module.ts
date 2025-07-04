import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { DailySummaryModule } from '../monitoring/daily-summary/daily-summary.module';

@Module({
  imports: [DailySummaryModule],
  controllers: [FinanceController],
})
export class FinanceModule {}
