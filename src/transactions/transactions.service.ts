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

  async update(updateDto: UpdateTransactionDto): Promise<Transaction | null> {
    const { _id, date, category, amount, method, concept } = updateDto;

    const updateData: Record<string, unknown> = {};
    if (date !== undefined) updateData.date = new Date(date);
    if (category !== undefined) updateData.category = category;
    if (amount !== undefined) updateData.amount = amount;
    if (method !== undefined) updateData.method = method;
    if (concept !== undefined) updateData.concept = concept;

    return this.transactionModel.findByIdAndUpdate(_id, updateData, {
      new: true,
    });
  }
}
