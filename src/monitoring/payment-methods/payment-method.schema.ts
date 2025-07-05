import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PaymentMethodDocument = HydratedDocument<PaymentMethod>;

@Schema({ collection: 'payment_methods' })
export class PaymentMethod {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['credit', 'debit'] })
  type: string;

  @Prop({ required: true })
  color: string;
}

export const PaymentMethodSchema = SchemaFactory.createForClass(PaymentMethod);
