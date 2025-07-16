import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Transaction,
  TransactionDocument,
} from '../../transactions/transaction.schema';
import {
  MonthlySummary,
  MonthlySummaryDocument,
} from '../monthly-summary/monthly-summary.schema';
import { Category, CategoryDocument } from '../categories/category.schema';
import {
  PaymentMethod,
  PaymentMethodDocument,
} from '../payment-methods/payment-method.schema';

@Injectable()
export class SummaryTransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(MonthlySummary.name)
    private readonly monthlyModel: Model<MonthlySummaryDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(PaymentMethod.name)
    private readonly paymentMethodModel: Model<PaymentMethodDocument>,
  ) {}

  async getMonthData(year: number, month: number, companyId: string) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const transactions = await this.transactionModel
      .find({ date: { $gte: start, $lt: end }, company_id: companyId })
      .lean();

    const id = `${year}-${String(month).padStart(2, '0')}`;
    const summary = await this.monthlyModel
      .findOne({ _id: id, company_id: companyId })
      .lean();

    const categoriesIncomeDocs = await this.categoryModel
      .find({ type: 'income' })
      .select('name -_id')
      .lean();
    const categoriesExpenseDocs = await this.categoryModel
      .find({ type: 'expense' })
      .select('name -_id')
      .lean();
    const paymentMethodsDocs = await this.paymentMethodModel
      .find()
      .select('name -_id')
      .lean();

    return {
      transactions,
      summary,
      categories_income: categoriesIncomeDocs.map((c) => c.name),
      categories_expense: categoriesExpenseDocs.map((c) => c.name),
      payment_methods: paymentMethodsDocs.map((p) => p.name),
    };
  }
}
