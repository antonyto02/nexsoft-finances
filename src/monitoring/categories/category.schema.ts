import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ collection: 'categories' })
export class Category {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  company_id: string;

  @Prop({ default: true })
  is_active: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
