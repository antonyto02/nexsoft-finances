import {
  Controller,
  Get,
  Query,
  BadRequestException,
  Headers,
} from '@nestjs/common';
import { DailySummaryService } from '../monitoring/daily-summary/daily-summary.service';
import { MonthlySummaryService } from '../monitoring/monthly-summary/monthly-summary.service';
import { extractCompanyId } from '../utils/token';

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
    @Query('day') day?: string,
    @Headers('authorization') auth?: string,
  ) {
    const companyId = extractCompanyId(auth);
    if (range === 'today') {
      if (view !== 'daily') {
        throw new BadRequestException('Invalid range or view');
      }

      const now = new Date();
      const utcDate = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
      const summary = await this.dailySummaryService.getSummaryByDate(
        utcDate,
        companyId,
      );

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

    if (range === 'last-7-days' || range === 'last-30-days') {
      if (view !== 'daily') {
        throw new BadRequestException('Invalid range or view');
      }

      const days = range === 'last-7-days' ? 7 : 30;
      const now = new Date();
      const utcToday = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
      const start = new Date(utcToday);
      start.setUTCDate(start.getUTCDate() - (days - 1));
      const end = new Date(utcToday);
      end.setUTCDate(end.getUTCDate() + 1);

      const summaries = await this.dailySummaryService.getSummariesByRange(
        start,
        end,
        companyId,
      );

      const totals = { income: 0, expense: 0, net_profit: 0, profit_margin: 0 };
      const incomeMap: Record<string, number> = {};
      const expenseMap: Record<string, number> = {};
      const incomeProgression: Array<{ x: string; y: number }> = [];
      const expenseProgression: Array<{ x: string; y: number }> = [];
      const netProfitProgression: Array<{ x: string; y: number }> = [];

      const summaryMap: Record<string, typeof summaries[number]> = {};
      for (const s of summaries) {
        const d = s.date.toISOString().split('T')[0];
        summaryMap[d] = s;
        totals.income += s.income_total;
        totals.expense += s.expense_total;
        for (const [name, amount] of Object.entries(s.categories_income ?? {})) {
          incomeMap[name] = (incomeMap[name] || 0) + (amount as number);
        }
        for (const [name, amount] of Object.entries(s.categories_expense ?? {})) {
          expenseMap[name] = (expenseMap[name] || 0) + (amount as number);
        }
      }

      const cursor = new Date(start);
      while (cursor <= utcToday) {
        const dayStr = cursor.toISOString().split('T')[0];
        const summary = summaryMap[dayStr];
        const income = summary ? summary.income_total : 0;
        const expense = summary ? summary.expense_total : 0;
        incomeProgression.push({ x: dayStr, y: income });
        expenseProgression.push({ x: dayStr, y: expense });
        netProfitProgression.push({ x: dayStr, y: summary ? summary.net_profit : 0 });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }

      totals.net_profit = totals.income - totals.expense;
      totals.profit_margin =
        totals.income > 0
          ? parseFloat(((totals.net_profit / totals.income) * 100).toFixed(2))
          : 0;

      const incomeCategories = Object.entries(incomeMap)
        .filter(([, amount]) => amount > 0)
        .map(([name, amount]) => ({ name, amount }));
      const expenseCategories = Object.entries(expenseMap)
        .filter(([, amount]) => amount > 0)
        .map(([name, amount]) => ({ name, amount }));

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

    if (
      (range === 'last-3-months' ||
        range === 'last-6-months' ||
        range === 'last-12-months') &&
      view === 'weekly'
    ) {
      const months = parseInt(range.split('-')[1], 10);
      const now = new Date();
      const utcToday = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
      const end = new Date(utcToday);
      end.setUTCDate(end.getUTCDate() + 1);

      const start = new Date(utcToday);
      start.setUTCMonth(start.getUTCMonth() - months);
      const startDay = start.getUTCDay();
      const diff = (startDay + 6) % 7;
      start.setUTCDate(start.getUTCDate() - diff);

      const summaries = await this.dailySummaryService.getSummariesByRange(
        start,
        end,
        companyId,
      );

      const weekMap: Record<
        string,
        {
          income: number;
          expense: number;
          categories_income: Record<string, number>;
          categories_expense: Record<string, number>;
        }
      > = {};

      for (const s of summaries) {
        const d = new Date(s.date);
        const day = d.getUTCDay();
        const monday = new Date(d);
        monday.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
        const key = monday.toISOString().split('T')[0];

        if (!weekMap[key]) {
          weekMap[key] = {
            income: 0,
            expense: 0,
            categories_income: {},
            categories_expense: {},
          };
        }

        weekMap[key].income += s.income_total;
        weekMap[key].expense += s.expense_total;

        for (const [name, amount] of Object.entries(s.categories_income ?? {})) {
          weekMap[key].categories_income[name] =
            (weekMap[key].categories_income[name] || 0) + (amount as number);
        }
        for (const [name, amount] of Object.entries(
          s.categories_expense ?? {},
        )) {
          weekMap[key].categories_expense[name] =
            (weekMap[key].categories_expense[name] || 0) + (amount as number);
        }
      }

      const totals = { income: 0, expense: 0, net_profit: 0, profit_margin: 0 };
      const incomeMap: Record<string, number> = {};
      const expenseMap: Record<string, number> = {};
      const incomeProgression: Array<{ x: string; y: number }> = [];
      const expenseProgression: Array<{ x: string; y: number }> = [];
      const netProfitProgression: Array<{ x: string; y: number }> = [];

      const cursor = new Date(start);
      while (cursor <= utcToday) {
        const key = cursor.toISOString().split('T')[0];
        const data = weekMap[key];

        const income = data ? data.income : 0;
        const expense = data ? data.expense : 0;
        const netProfit = income - expense;

        totals.income += income;
        totals.expense += expense;

        incomeProgression.push({ x: key, y: income });
        expenseProgression.push({ x: key, y: expense });
        netProfitProgression.push({ x: key, y: netProfit });

        if (data) {
          for (const [name, amount] of Object.entries(data.categories_income)) {
            incomeMap[name] = (incomeMap[name] || 0) + amount;
          }
          for (const [name, amount] of Object.entries(data.categories_expense)) {
            expenseMap[name] = (expenseMap[name] || 0) + amount;
          }
        }

        cursor.setUTCDate(cursor.getUTCDate() + 7);
      }

      totals.net_profit = totals.income - totals.expense;
      totals.profit_margin =
        totals.income > 0
          ? parseFloat(((totals.net_profit / totals.income) * 100).toFixed(2))
          : 0;

      const incomeCategories = Object.entries(incomeMap)
        .filter(([, amount]) => amount > 0)
        .map(([name, amount]) => ({ name, amount }));
      const expenseCategories = Object.entries(expenseMap)
        .filter(([, amount]) => amount > 0)
        .map(([name, amount]) => ({ name, amount }));

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

    if (
      range === 'last-3-months' ||
      range === 'last-6-months' ||
      range === 'last-12-months'
    ) {
      if (view !== 'monthly') {
        throw new BadRequestException('Invalid range or view');
      }

      const months = parseInt(range.split('-')[1], 10);
      const now = new Date();
      let year = now.getUTCFullYear();
      let month = now.getUTCMonth() + 1;

      const ids: string[] = [];
      for (let i = 0; i < months; i++) {
        ids.unshift(`${year}-${String(month).padStart(2, '0')}`);
        month -= 1;
        if (month === 0) {
          month = 12;
          year -= 1;
        }
      }

      const summaries = await this.monthlySummaryService.getSummariesByIds(
        ids,
        companyId,
      );
      const summaryMap: Record<string, (typeof summaries)[number]> = {};
      for (const s of summaries) {
        const id = `${s.year}-${String(s.month).padStart(2, '0')}`;
        summaryMap[id] = s as any;
      }

      const totals = { income: 0, expense: 0, net_profit: 0, profit_margin: 0 };
      const incomeMap: Record<string, number> = {};
      const expenseMap: Record<string, number> = {};
      const incomeProgression: Array<{ x: string; y: number }> = [];
      const expenseProgression: Array<{ x: string; y: number }> = [];
      const netProfitProgression: Array<{ x: string; y: number }> = [];

      for (const id of ids) {
        const summary = summaryMap[id];
        const income = summary ? summary.totals.total_income : 0;
        const expense = summary ? summary.totals.total_expense : 0;
        const netProfit = summary ? summary.totals.net_profit : 0;

        totals.income += income;
        totals.expense += expense;

        incomeProgression.push({ x: id, y: income });
        expenseProgression.push({ x: id, y: expense });
        netProfitProgression.push({ x: id, y: netProfit });

        if (summary) {
          for (const [name, amount] of Object.entries(
            summary.categories_income ?? {},
          )) {
            incomeMap[name] = (incomeMap[name] || 0) + (amount as number);
          }
          for (const [name, amount] of Object.entries(
            summary.categories_expense ?? {},
          )) {
            expenseMap[name] = (expenseMap[name] || 0) + (amount as number);
          }
        }
      }

      totals.net_profit = totals.income - totals.expense;
      totals.profit_margin =
        totals.income > 0
          ? parseFloat(((totals.net_profit / totals.income) * 100).toFixed(2))
          : 0;

      const incomeCategories = Object.entries(incomeMap)
        .filter(([, amount]) => amount > 0)
        .map(([name, amount]) => ({ name, amount }));
      const expenseCategories = Object.entries(expenseMap)
        .filter(([, amount]) => amount > 0)
        .map(([name, amount]) => ({ name, amount }));

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

    let dayNum: number | undefined;
    if (day !== undefined) {
      dayNum = parseInt(day, 10);
      if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
        throw new BadRequestException('Invalid day');
      }
    }

    if (dayNum && !monthNum) {
      throw new BadRequestException('day requires month');
    }

    if (monthNum) {
      if (dayNum) {
        const date = new Date(Date.UTC(yearNum, monthNum - 1, dayNum));
        const summary = await this.dailySummaryService.getSummaryByDate(
          date,
          companyId,
        );

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

        const incomeCategories = Object.entries(
          summary.categories_income ?? {},
        ).map(([name, amount]) => ({ name, amount }));
        const expenseCategories = Object.entries(
          summary.categories_expense ?? {},
        ).map(([name, amount]) => ({ name, amount }));

        return {
          totals: {
            income: summary.income_total,
            expense: summary.expense_total,
            net_profit: summary.net_profit,
            profit_margin: profitMargin,
          },
          categories: { income: incomeCategories, expense: expenseCategories },
          income_progression: [],
          expense_progression: [],
          net_profit_progression: [],
        };
      }

      const summaries = await this.dailySummaryService.getSummariesByMonth(
        yearNum,
        monthNum,
        companyId,
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
      await this.monthlySummaryService.getSummariesByYear(yearNum, companyId);

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
