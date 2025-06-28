import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MonthlySummary, MonthlySummarySchema } from './monthly-summary.schema';
import { MonthlySummaryService } from './monthly-summary.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MonthlySummary.name, schema: MonthlySummarySchema }]),
  ],
  providers: [MonthlySummaryService],
  exports: [MonthlySummaryService],
})
export class MonthlySummaryModule {}
