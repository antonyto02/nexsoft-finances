import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ collection: 'transactions' })
export class Transaction {
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true, enum: ['income', 'expense'] })
  type: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true })
  method: string;

  @Prop({ required: true })
  concept: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
