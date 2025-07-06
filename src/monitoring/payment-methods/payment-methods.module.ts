import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentMethodsController } from './payment-methods.controller';
import { PaymentMethodsService } from './payment-methods.service';
import { PaymentMethod, PaymentMethodSchema } from './payment-method.schema';
import { Transaction, TransactionSchema } from '../../transactions/transaction.schema';
import { MonthlySummary, MonthlySummarySchema } from '../monthly-summary/monthly-summary.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentMethod.name, schema: PaymentMethodSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: MonthlySummary.name, schema: MonthlySummarySchema },
    ]),
  ],
  controllers: [PaymentMethodsController],
  providers: [PaymentMethodsService],
})
export class PaymentMethodsModule {}
