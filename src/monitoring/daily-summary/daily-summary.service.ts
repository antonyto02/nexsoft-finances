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

    let summary = await this.summaryModel.findOne({ date: new Date(dateString) });
    if (!summary) {
      summary = new this.summaryModel({ date: new Date(dateString) });
    }

    if (payload.type === 'income') {
      summary.income_total += payload.amount;
      summary.categories_income[payload.category] =
        (summary.categories_income[payload.category] || 0) + payload.amount;
    } else {
      summary.expense_total += payload.amount;
      summary.categories_expense[payload.category] =
        (summary.categories_expense[payload.category] || 0) + payload.amount;
    }

    summary.net_profit = summary.income_total - summary.expense_total;
    await summary.save();
  }
}
