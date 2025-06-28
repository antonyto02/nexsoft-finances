// src/app.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CategoriesModule } from './monitoring/categories/categories.module';
import { PaymentMethodsModule } from './monitoring/payment-methods/payment-methods.module';
import { TransactionsModule } from './transactions/transactions.module';
import { SummaryTransactionsModule } from './monitoring/summary-transactions/summary-transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI', { infer: true }),
      }),
      inject: [ConfigService],
    }),
    CategoriesModule,
    PaymentMethodsModule,
    TransactionsModule,
    SummaryTransactionsModule,
  ],
})
export class AppModule {}
