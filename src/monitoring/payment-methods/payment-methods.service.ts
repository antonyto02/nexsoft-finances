import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentMethod, PaymentMethodDocument } from './payment-method.schema';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { Transaction, TransactionDocument } from '../../transactions/transaction.schema';

@Injectable()
export class PaymentMethodsService {
  constructor(
    @InjectModel(PaymentMethod.name)
    private readonly paymentMethodModel: Model<PaymentMethodDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
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

  async update(
    oldName: string,
    dto: UpdatePaymentMethodDto,
  ): Promise<void> {
    if (!dto.name && !dto.color) {
      throw new BadRequestException('name or color is required');
    }

    const method = await this.paymentMethodModel.findOne({ name: oldName });
    if (!method) {
      throw new NotFoundException('Payment method not found');
    }

    if (dto.name && dto.name !== oldName) {
      const conflict = await this.paymentMethodModel.findOne({ name: dto.name });
      if (conflict) {
        throw new ConflictException('Payment method name already exists');
      }
    }

    if (dto.name) {
      method.name = dto.name;
    }
    if (dto.color) {
      method.color = dto.color;
    }

    await method.save();

    if (dto.name && dto.name !== oldName) {
      await this.transactionModel.updateMany(
        { method: oldName },
        { $set: { method: dto.name } },
      );
    }
  }
}
