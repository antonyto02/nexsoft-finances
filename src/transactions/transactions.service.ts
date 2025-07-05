import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from './transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { DailySummaryService } from '../monitoring/daily-summary/daily-summary.service';
import { MonthlySummaryService } from '../monitoring/monthly-summary/monthly-summary.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    private readonly dailySummaryService: DailySummaryService,
    private readonly monthlySummaryService: MonthlySummaryService,
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
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

    await this.monthlySummaryService.updateSummary({
      date: transaction.date,
      type: transaction.type as 'income' | 'expense',
      category: transaction.category,
      amount: transaction.amount,
      payment_method: transaction.method,
    });

    return transaction;
  }

  async update(
    id: string,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const original = await this.transactionModel.findById(id);
    if (!original) {
      throw new Error('Transaction not found');
    }

    await this.dailySummaryService.updateSummary({
      date: original.date,
      type: original.type as 'income' | 'expense',
      category: original.category,
      amount: -original.amount,
    });

    await this.monthlySummaryService.updateSummary({
      date: original.date,
      type: original.type as 'income' | 'expense',
      category: original.category,
      amount: -original.amount,
      payment_method: original.method,
    });

    await this.transactionModel.deleteOne({ _id: id });

    const created = new this.transactionModel({
      ...updateTransactionDto,
      date: new Date(updateTransactionDto.date),
    });
    const transaction = await created.save();

    await this.dailySummaryService.updateSummary({
      date: transaction.date,
      type: transaction.type as 'income' | 'expense',
      category: transaction.category,
      amount: transaction.amount,
    });

    await this.monthlySummaryService.updateSummary({
      date: transaction.date,
      type: transaction.type as 'income' | 'expense',
      category: transaction.category,
      amount: transaction.amount,
      payment_method: transaction.method,
    });

    return transaction;
  }
}
