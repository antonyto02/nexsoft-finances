import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentMethod, PaymentMethodDocument } from './payment-method.schema';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(
    @InjectModel(PaymentMethod.name)
    private readonly paymentMethodModel: Model<PaymentMethodDocument>,
  ) {}

  async create(
    createPaymentMethodDto: CreatePaymentMethodDto,
  ): Promise<PaymentMethod> {
    const created = new this.paymentMethodModel(createPaymentMethodDto);
    return created.save();
  }

  async findAll(): Promise<PaymentMethod[]> {
    return this.paymentMethodModel.find().lean();
  }
}
