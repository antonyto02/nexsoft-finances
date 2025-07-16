import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DailySummaryDocument = HydratedDocument<DailySummary>;

@Schema({ collection: 'daily_summary' })
export class DailySummary {
  @Prop({ required: true })
  company_id: string;
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true, default: 0 })
  income_total: number;

  @Prop({ required: true, default: 0 })
  expense_total: number;

  @Prop({ required: true, default: 0 })
  net_profit: number;

  @Prop({ type: Object, required: true, default: {} })
  categories_income: Record<string, number>;

  @Prop({ type: Object, required: true, default: {} })
  categories_expense: Record<string, number>;
}

export const DailySummarySchema = SchemaFactory.createForClass(DailySummary);
