import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MonthlySummaryDocument = HydratedDocument<MonthlySummary>;

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

MonthlySummarySchema.pre<MonthlySummaryDocument>('save', async function (next) {
  if (!this.isNew) {
    return next();
  }

  const prevMonth = this.month === 1 ? 12 : this.month - 1;
  const prevYear = this.month === 1 ? this.year - 1 : this.year;
  const prevId = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  const prevSummary = (await this.model<MonthlySummary>(
    'MonthlySummary',
  ).findById(prevId)) as MonthlySummaryDocument | null;

  if (prevSummary) {
    this.initial_balance = { ...prevSummary.final_balance };
  } else {
    this.initial_balance = {};
  }

  if (!this.final_balance || Object.keys(this.final_balance).length === 0) {
    this.final_balance = { ...this.initial_balance };
  }

  next();
});
