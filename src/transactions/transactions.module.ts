import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { Transaction, TransactionSchema } from './transaction.schema';
import { DailySummaryModule } from '../monitoring/daily-summary/daily-summary.module';
import { MonthlySummaryModule } from '../monitoring/monthly-summary/monthly-summary.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }]),
    DailySummaryModule,
    MonthlySummaryModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
