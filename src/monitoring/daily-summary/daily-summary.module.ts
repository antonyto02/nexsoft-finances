import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DailySummary, DailySummarySchema } from './daily-summary.schema';
import { DailySummaryService } from './daily-summary.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: DailySummary.name, schema: DailySummarySchema }]),
  ],
  providers: [DailySummaryService],
  exports: [DailySummaryService],
})
export class DailySummaryModule {}
