import { Controller, Get } from '@nestjs/common';
import { DailySummaryService } from '../monitoring/daily-summary/daily-summary.service';

@Controller('finance')
export class FinanceController {
  constructor(private readonly dailySummaryService: DailySummaryService) {}

  @Get('summary')
  async getTodaySummary() {
    const now = new Date();
    const utcDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const netProfit = await this.dailySummaryService.getNetProfitByDate(utcDate);
    return { net_profit: netProfit };
  }
}
