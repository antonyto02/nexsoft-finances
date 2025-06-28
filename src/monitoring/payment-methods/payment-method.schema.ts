import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentMethodDocument = PaymentMethod & Document;

@Schema({ collection: 'payment_methods' })
export class PaymentMethod {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['cash', 'debit', 'credit'] })
  type: string;
}

export const PaymentMethodSchema = SchemaFactory.createForClass(PaymentMethod);
