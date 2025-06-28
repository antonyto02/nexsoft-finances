import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from './transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { DailySummaryService } from '../monitoring/daily-summary/daily-summary.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    private readonly dailySummaryService: DailySummaryService,
  ) {}

  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const created = new this.transactionModel({
      ...createTransactionDto,
      date: new Date(createTransactionDto.date),
    });
    const transaction = await created.save();

    await this.dailySummaryService.updateSummary({
      date: transaction.date,
      type: transaction.type as 'income' | 'expense',
      category: transaction.category,
      amount: transaction.amount,
    });

    return transaction;
  }
}
