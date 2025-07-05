import { Body, Controller, Patch, Post } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  async create(@Body() dto: CreateTransactionDto) {
    const data = await this.transactionsService.create(dto);
    return data;
  }

  @Patch()
  async update(@Body() dto: UpdateTransactionDto) {
    const data = await this.transactionsService.update(dto);
    return data;
  }
}
