import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SummaryTransactionsController } from './summary-transactions.controller';
import { SummaryTransactionsService } from './summary-transactions.service';
import {
  Transaction,
  TransactionSchema,
} from '../../transactions/transaction.schema';
import {
  MonthlySummary,
  MonthlySummarySchema,
} from '../monthly-summary/monthly-summary.schema';
import { Category, CategorySchema } from '../categories/category.schema';
import {
  PaymentMethod,
  PaymentMethodSchema,
} from '../payment-methods/payment-method.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: MonthlySummary.name, schema: MonthlySummarySchema },
      { name: Category.name, schema: CategorySchema },
      { name: PaymentMethod.name, schema: PaymentMethodSchema },
    ]),
  ],
  controllers: [SummaryTransactionsController],
  providers: [SummaryTransactionsService],
})
export class SummaryTransactionsModule {}
