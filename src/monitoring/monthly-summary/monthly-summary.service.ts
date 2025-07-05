import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MonthlySummary, MonthlySummaryDocument } from './monthly-summary.schema';

interface UpdatePayload {
  date: Date;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  payment_method: string;
}

@Injectable()
export class MonthlySummaryService {
  constructor(
    @InjectModel(MonthlySummary.name)
    private readonly summaryModel: Model<MonthlySummary>,
  ) {}

  private async createNewSummary(
    year: number,
    month: number,
  ): Promise<MonthlySummaryDocument> {
    const id = `${year}-${String(month).padStart(2, '0')}`;

    let initial_balance: Record<string, number> = {};
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevId = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
    const prevSummary = await this.summaryModel.findById(prevId);
    if (prevSummary) {
      initial_balance = { ...prevSummary.final_balance };
    }

    const summary = new this.summaryModel({
      _id: id,
      month,
      year,
      initial_balance,
      totals: { total_income: 0, total_expense: 0, net_profit: 0, profit_margin: 0 },
      categories_income: {},
      categories_expense: {},
      final_balance: { ...initial_balance },
    });

    await summary.save();
    return summary;
  }

  async updateSummary(payload: UpdatePayload): Promise<void> {
    const year = payload.date.getUTCFullYear();
    const month = payload.date.getUTCMonth() + 1;
    const id = `${year}-${String(month).padStart(2, '0')}`;

    let summary = await this.summaryModel.findById(id);
    if (!summary) {
      summary = await this.createNewSummary(year, month);
    }

    if (!summary) {
      throw new Error('Failed to load or create monthly summary');
    }

    if (payload.type === 'income') {
      summary.totals.total_income += payload.amount;
      summary.categories_income[payload.category] =
        (summary.categories_income[payload.category] || 0) + payload.amount;
      summary.final_balance[payload.payment_method] =
        (summary.final_balance[payload.payment_method] || 0) + payload.amount;
      summary.markModified('categories_income');
    } else {
      summary.totals.total_expense += payload.amount;
      summary.categories_expense[payload.category] =
        (summary.categories_expense[payload.category] || 0) + payload.amount;
      summary.final_balance[payload.payment_method] =
        (summary.final_balance[payload.payment_method] || 0) - payload.amount;
      summary.markModified('categories_expense');
    }

    summary.totals.net_profit = summary.totals.total_income - summary.totals.total_expense;
    if (summary.totals.total_income > 0) {
      summary.totals.profit_margin =
        (summary.totals.net_profit / summary.totals.total_income) * 100;
    } else {
      summary.totals.profit_margin = 0;
    }

    summary.markModified('totals');
    summary.markModified('final_balance');
    await summary.save();

    // Propagate changes to subsequent months if they exist
    let prevSummary = summary;
    let nextMonth = month === 12 ? 1 : month + 1;
    let nextYear = month === 12 ? year + 1 : year;

    while (true) {
      const nextId = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
      const nextSummary = await this.summaryModel.findById(nextId);
      if (!nextSummary) {
        break;
      }

      nextSummary.initial_balance = { ...prevSummary.final_balance };
      nextSummary.final_balance[nextSummary ? payload.payment_method : ''] =
        (nextSummary.final_balance[payload.payment_method] || 0) +
        (payload.type === 'income' ? payload.amount : -payload.amount);

      nextSummary.markModified('initial_balance');
      nextSummary.markModified('final_balance');
      await nextSummary.save();

      prevSummary = nextSummary;
      nextMonth = nextMonth === 12 ? 1 : nextMonth + 1;
      nextYear = nextMonth === 1 ? nextYear + 1 : nextYear;
    }
  }
}
