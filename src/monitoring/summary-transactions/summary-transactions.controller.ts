import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { SummaryTransactionsService } from './summary-transactions.service';

function extractCompanyId(token?: string): string {
  if (!token) {
    throw new UnauthorizedException('Authorization header missing');
  }
  const raw = token.startsWith('Bearer ') ? token.slice(7) : token;
  const parts = raw.split('.');
  if (parts.length < 2) {
    throw new UnauthorizedException('Invalid token');
  }
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload.company_id || payload.companyId;
  } catch {
    throw new UnauthorizedException('Invalid token');
  }
}

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
