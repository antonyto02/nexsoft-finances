import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DailySummary, DailySummaryDocument } from './daily-summary.schema';

interface UpdatePayload {
  date: Date;
  type: 'income' | 'expense';
  category: string;
  amount: number;
}

@Injectable()
export class DailySummaryService {
  constructor(
    @InjectModel(DailySummary.name)
    private readonly summaryModel: Model<DailySummaryDocument>,
  ) {}

  async updateSummary(payload: UpdatePayload): Promise<void> {
    const dateString = payload.date.toISOString().split('T')[0];

    let summary = await this.summaryModel.findOne({
      date: new Date(dateString),
    });
    if (!summary) {
      summary = new this.summaryModel({ date: new Date(dateString) });
    }

    if (payload.type === 'income') {
      summary.income_total += payload.amount;
      summary.categories_income[payload.category] =
        (summary.categories_income[payload.category] || 0) + payload.amount;
      summary.markModified('categories_income');
    } else {
      summary.expense_total += payload.amount;
      summary.categories_expense[payload.category] =
        (summary.categories_expense[payload.category] || 0) + payload.amount;
      summary.markModified('categories_expense');
    }

    summary.net_profit = summary.income_total - summary.expense_total;
    await summary.save();
  }

  async getNetProfitByDate(date: Date): Promise<number> {
    const dateString = date.toISOString().split('T')[0];
    const summary = await this.summaryModel
      .findOne({ date: new Date(dateString) })
      .select('net_profit')
      .lean();

    return summary ? summary.net_profit : 0;
  }

  async getSummaryByDate(date: Date): Promise<DailySummary | null> {
    const dateString = date.toISOString().split('T')[0];
    return this.summaryModel.findOne({ date: new Date(dateString) }).lean();
  }

  async getSummariesByMonth(
    year: number,
    month: number,
  ): Promise<DailySummary[]> {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(
      Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1),
    );

    return this.summaryModel
      .find({ date: { $gte: start, $lt: end } })
      .sort({ date: 1 })
      .lean();
  }

  async getSummariesByRange(
    start: Date,
    end: Date,
  ): Promise<DailySummary[]> {
    return this.summaryModel
      .find({ date: { $gte: start, $lt: end } })
      .sort({ date: 1 })
      .lean();
  }
}
