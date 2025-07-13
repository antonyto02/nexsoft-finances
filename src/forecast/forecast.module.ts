import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ForecastController } from './forecast.controller';
import { ForecastService } from './forecast.service';
import { MonthlySummary, MonthlySummarySchema } from '../monitoring/monthly-summary/monthly-summary.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MonthlySummary.name, schema: MonthlySummarySchema }]),
  ],
  controllers: [ForecastController],
  providers: [ForecastService],
})
export class ForecastModule {}
