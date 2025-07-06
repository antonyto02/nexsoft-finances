import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransferController } from './TransferController';
import { MonthlySummaryModule } from '../monitoring/monthly-summary/monthly-summary.module';
import { Transaction, TransactionSchema } from '../transactions/transaction.schema';
import { PaymentMethod, PaymentMethodSchema } from '../monitoring/payment-methods/payment-method.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: PaymentMethod.name, schema: PaymentMethodSchema },
    ]),
    MonthlySummaryModule,
  ],
  controllers: [TransferController],
})
export class TransferModule {}
