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

  private extractDestination(concept: string): string | null {
    const transferPrefix = 'Transferencia a ';
    const payPrefix = 'Pago a ';
    if (concept.startsWith(transferPrefix)) {
      return concept.slice(transferPrefix.length);
    }
    if (concept.startsWith(payPrefix)) {
      return concept.slice(payPrefix.length);
    }
    return null;
  }

  async create(
    createTransactionDto: CreateTransactionDto,
    companyId: string,
  ): Promise<Transaction> {
    const created = new this.transactionModel({
      ...createTransactionDto,
      date: new Date(createTransactionDto.date),
      company_id: companyId,
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

    const originalIsTransfer =
      original.category === 'Transferencia' || original.category === 'Pago de TDC';

    if (originalIsTransfer) {
      const dest = this.extractDestination(original.concept);
      if (dest) {
        await this.monthlySummaryService.registerTransfer({
          date: original.date,
          from: original.method,
          to: dest,
          amount: -original.amount,
        });
      }
    } else {
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
    }

    await this.transactionModel.deleteOne({ _id: id });

    const created = new this.transactionModel({
      ...updateTransactionDto,
      date: new Date(updateTransactionDto.date),
    });
    const transaction = await created.save();

    const newIsTransfer =
      transaction.category === 'Transferencia' ||
      transaction.category === 'Pago de TDC';

    if (newIsTransfer) {
      const dest = this.extractDestination(transaction.concept);
      if (dest) {
        await this.monthlySummaryService.registerTransfer({
          date: transaction.date,
          from: transaction.method,
          to: dest,
          amount: transaction.amount,
        });
      }
    } else {
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
    }

    return transaction;
  }

  async remove(id: string): Promise<void> {
    const transaction = await this.transactionModel.findById(id);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const isTransfer =
      transaction.category === 'Transferencia' ||
      transaction.category === 'Pago de TDC';

    if (isTransfer) {
      const dest = this.extractDestination(transaction.concept);
      if (dest) {
        await this.monthlySummaryService.registerTransfer({
          date: transaction.date,
          from: transaction.method,
          to: dest,
          amount: -transaction.amount,
        });
      }
    } else {
      await this.dailySummaryService.updateSummary({
        date: transaction.date,
        type: transaction.type as 'income' | 'expense',
        category: transaction.category,
        amount: -transaction.amount,
      });

      await this.monthlySummaryService.updateSummary({
        date: transaction.date,
        type: transaction.type as 'income' | 'expense',
        category: transaction.category,
        amount: -transaction.amount,
        payment_method: transaction.method,
      });
    }

    await this.transactionModel.deleteOne({ _id: id });
  }
}
