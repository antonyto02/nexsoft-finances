import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { Category, CategorySchema } from './category.schema';
import { Transaction, TransactionSchema } from '../../transactions/transaction.schema';
import { DailySummary, DailySummarySchema } from '../daily-summary/daily-summary.schema';
import { MonthlySummary, MonthlySummarySchema } from '../monthly-summary/monthly-summary.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: DailySummary.name, schema: DailySummarySchema },
      { name: MonthlySummary.name, schema: MonthlySummarySchema },
    ]),
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
