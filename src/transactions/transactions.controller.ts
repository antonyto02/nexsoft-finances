import {
  Body,
  Controller,
  Patch,
  Param,
  Post,
  Delete,
  Headers,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { extractCompanyId } from '../utils/token';

@Controller('finances/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  async create(
    @Body() dto: CreateTransactionDto,
    @Headers('authorization') auth?: string,
  ) {
    const companyId = extractCompanyId(auth);
    const data = await this.transactionsService.create(dto, companyId);
    return data;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTransactionDto) {
    const data = await this.transactionsService.update(id, dto);
    return data;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.transactionsService.remove(id);
    return { message: 'Transaction deleted' };
  }
}
