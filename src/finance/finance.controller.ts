import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { DailySummaryService } from '../monitoring/daily-summary/daily-summary.service';
import { MonthlySummaryService } from '../monitoring/monthly-summary/monthly-summary.service';

@Controller('finances')
export class FinanceController {
  constructor(
    private readonly dailySummaryService: DailySummaryService,
    private readonly monthlySummaryService: MonthlySummaryService,
  ) {}

  @Get('summary')
  async getSummary(
    @Query('range') range = 'today',
    @Query('view') view = 'daily',
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    if (range === 'today') {
      if (view !== 'daily') {
        throw new BadRequestException('Invalid range or view');
      }

      const now = new Date();
      const utcDate = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
      const summary = await this.dailySummaryService.getSummaryByDate(utcDate);

      if (!summary) {
        return {
          totals: {
            income: 0,
            expense: 0,
            net_profit: 0,
            profit_margin: 0,
          },
          categories: { income: [], expense: [] },
          income_progression: [],
          expense_progression: [],
          net_profit_progression: [],
        };
      }

      const profitMargin =
        summary.income_total > 0
          ? parseFloat(
              ((summary.net_profit / summary.income_total) * 100).toFixed(2),
            )
          : 0;

      const incomeCategoriesRaw = summary.categories_income ?? {};
      const expenseCategoriesRaw = summary.categories_expense ?? {};

      const incomeCategories = Object.entries(incomeCategoriesRaw).map(
        ([name, amount]) => ({ name, amount }),
      );
      const expenseCategories = Object.entries(expenseCategoriesRaw).map(
        ([name, amount]) => ({ name, amount }),
      );

      return {
        totals: {
          income: summary.income_total,
          expense: summary.expense_total,
          net_profit: summary.net_profit,
          profit_margin: profitMargin,
        },
        categories: {
          income: incomeCategories,
          expense: expenseCategories,
        },
        income_progression: [],
        expense_progression: [],
        net_profit_progression: [],
      };
    }

    if (range !== 'custom') {
      throw new BadRequestException('Invalid range or view');
    }

    if (!year) {
      throw new BadRequestException('year is required');
    }

    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum)) {
      throw new BadRequestException('Invalid year');
    }

    let monthNum: number | undefined;
    if (month !== undefined) {
      monthNum = parseInt(month, 10);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        throw new BadRequestException('Invalid month');
      }
    }

    if (monthNum) {
      const summaries = await this.dailySummaryService.getSummariesByMonth(
        yearNum,
        monthNum,
      );

      const totals = { income: 0, expense: 0, net_profit: 0, profit_margin: 0 };
      const incomeMap: Record<string, number> = {};
      const expenseMap: Record<string, number> = {};
      const incomeProgression: Array<{ x: string; y: number }> = [];
      const expenseProgression: Array<{ x: string; y: number }> = [];
      const netProfitProgression: Array<{ x: string; y: number }> = [];

      for (const day of summaries) {
        const dayStr = day.date.toISOString().split('T')[0];
        totals.income += day.income_total;
        totals.expense += day.expense_total;
        incomeProgression.push({ x: dayStr, y: day.income_total });
        expenseProgression.push({ x: dayStr, y: day.expense_total });
        netProfitProgression.push({ x: dayStr, y: day.net_profit });

        for (const [name, amount] of Object.entries(
          day.categories_income ?? {},
        )) {
          incomeMap[name] = (incomeMap[name] || 0) + (amount as number);
        }
        for (const [name, amount] of Object.entries(
          day.categories_expense ?? {},
        )) {
          expenseMap[name] = (expenseMap[name] || 0) + (amount as number);
        }
      }

      totals.net_profit = totals.income - totals.expense;
      totals.profit_margin =
        totals.income > 0
          ? parseFloat(((totals.net_profit / totals.income) * 100).toFixed(2))
          : 0;

      const incomeCategories = Object.entries(incomeMap).map(
        ([name, amount]) => ({
          name,
          amount,
        }),
      );
      const expenseCategories = Object.entries(expenseMap).map(
        ([name, amount]) => ({
          name,
          amount,
        }),
      );

      return {
        totals,
        categories: {
          income: incomeCategories,
          expense: expenseCategories,
        },
        income_progression: incomeProgression,
        expense_progression: expenseProgression,
        net_profit_progression: netProfitProgression,
      };
    }

    const summaries =
      await this.monthlySummaryService.getSummariesByYear(yearNum);

    const totals = { income: 0, expense: 0, net_profit: 0, profit_margin: 0 };
    const incomeMap: Record<string, number> = {};
    const expenseMap: Record<string, number> = {};
    const incomeProgression: Array<{ x: number; y: number }> = [];
    const expenseProgression: Array<{ x: number; y: number }> = [];
    const netProfitProgression: Array<{ x: number; y: number }> = [];

    for (const monthSummary of summaries) {
      totals.income += monthSummary.totals.total_income;
      totals.expense += monthSummary.totals.total_expense;
      incomeProgression.push({
        x: monthSummary.month,
        y: monthSummary.totals.total_income,
      });
      expenseProgression.push({
        x: monthSummary.month,
        y: monthSummary.totals.total_expense,
      });
      netProfitProgression.push({
        x: monthSummary.month,
        y: monthSummary.totals.net_profit,
      });

      for (const [name, amount] of Object.entries(
        monthSummary.categories_income ?? {},
      )) {
        incomeMap[name] = (incomeMap[name] || 0) + (amount as number);
      }
      for (const [name, amount] of Object.entries(
        monthSummary.categories_expense ?? {},
      )) {
        expenseMap[name] = (expenseMap[name] || 0) + (amount as number);
      }
    }

    totals.net_profit = totals.income - totals.expense;
    totals.profit_margin =
      totals.income > 0
        ? parseFloat(((totals.net_profit / totals.income) * 100).toFixed(2))
        : 0;

    const incomeCategories = Object.entries(incomeMap).map(
      ([name, amount]) => ({
        name,
        amount,
      }),
    );
    const expenseCategories = Object.entries(expenseMap).map(
      ([name, amount]) => ({
        name,
        amount,
      }),
    );

    return {
      totals,
      categories: {
        income: incomeCategories,
        expense: expenseCategories,
      },
      income_progression: incomeProgression,
      expense_progression: expenseProgression,
      net_profit_progression: netProfitProgression,
    };
  }
}
