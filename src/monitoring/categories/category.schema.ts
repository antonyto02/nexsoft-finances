import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ collection: 'categories' })
export class Category {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
