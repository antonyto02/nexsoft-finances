import { Body, Controller, Patch, Param, Post, Delete } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Controller('finances/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  async create(@Body() dto: CreateTransactionDto) {
    const data = await this.transactionsService.create(dto);
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
