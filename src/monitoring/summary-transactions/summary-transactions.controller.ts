import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Headers,
} from '@nestjs/common';
import { SummaryTransactionsService } from './summary-transactions.service';
import { extractCompanyId } from '../../utils/token';

@Controller('monitoring/summary-and-transactions')
export class SummaryTransactionsController {
  constructor(private readonly service: SummaryTransactionsService) {}

  @Get(':year/:month')
  async getMonth(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Headers('authorization') auth?: string,
  ) {
    const companyId = extractCompanyId(auth);
    return this.service.getMonthData(year, month, companyId);
  }
}
