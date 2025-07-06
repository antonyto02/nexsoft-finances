import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { DailySummaryService } from '../monitoring/daily-summary/daily-summary.service';

@Controller('finances')
export class FinanceController {
  constructor(private readonly dailySummaryService: DailySummaryService) {}

  @Get('summary')
  async getTodaySummary(
    @Query('range') range = 'today',
    @Query('view') view = 'daily',
  ) {
    if (range !== 'today' || view !== 'daily') {
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
      };
    }

    const profitMargin =
      summary.income_total > 0
        ? parseFloat(
            (
              (summary.net_profit / summary.income_total) *
              100
            ).toFixed(2),
          )
        : 0;

    const incomeCategories = Object.entries(summary.categories_income).map(
      ([name, amount]) => ({ name, amount }),
    );
    const expenseCategories = Object.entries(summary.categories_expense).map(
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
    };
  }
}
