import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MonthlySummaryDocument = MonthlySummary & Document;

@Schema({ collection: 'monthly_summary' })
export class MonthlySummary {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true })
  month: number;

  @Prop({ required: true })
  year: number;

  @Prop({ type: Object, required: true, default: {} })
  initial_balance: Record<string, number>;

  @Prop({
    type: Object,
    required: true,
    default: { total_income: 0, total_expense: 0, net_profit: 0, profit_margin: 0 },
  })
  totals: {
    total_income: number;
    total_expense: number;
    net_profit: number;
    profit_margin: number;
  };

  @Prop({ type: Object, required: true, default: {} })
  categories_income: Record<string, number>;

  @Prop({ type: Object, required: true, default: {} })
  categories_expense: Record<string, number>;

  @Prop({ type: Object, required: true, default: {} })
  final_balance: Record<string, number>;
}

export const MonthlySummarySchema = SchemaFactory.createForClass(MonthlySummary);
