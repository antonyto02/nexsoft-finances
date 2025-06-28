import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { SummaryTransactionsService } from './summary-transactions.service';

@Controller('monitoring/summary-and-transactions')
export class SummaryTransactionsController {
  constructor(private readonly service: SummaryTransactionsService) {}

  @Get(':year/:month')
  async getMonth(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.service.getMonthData(year, month);
  }
}
