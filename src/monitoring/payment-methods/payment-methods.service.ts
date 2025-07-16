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
import {
  Transaction,
  TransactionDocument,
} from '../../transactions/transaction.schema';
import {
  MonthlySummary,
  MonthlySummaryDocument,
} from '../monthly-summary/monthly-summary.schema';

@Injectable()
export class PaymentMethodsService {
  constructor(
    @InjectModel(PaymentMethod.name)
    private readonly paymentMethodModel: Model<PaymentMethodDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(MonthlySummary.name)
    private readonly monthlySummaryModel: Model<MonthlySummaryDocument>,
  ) {}

  async create(
    createPaymentMethodDto: CreatePaymentMethodDto,
    companyId: string,
  ): Promise<PaymentMethod> {
    const created = new this.paymentMethodModel({
      ...createPaymentMethodDto,
      is_active: true,
      company_id: companyId,
    });
    return created.save();
  }

  async findAll(companyId: string): Promise<PaymentMethod[]> {
    return this.paymentMethodModel
      .find({ company_id: companyId, type: 'cash' })
      .lean();
  }

  async update(oldName: string, dto: UpdatePaymentMethodDto): Promise<void> {
    if (!dto.name && !dto.color) {
      throw new BadRequestException('name or color is required');
    }

    const method = await this.paymentMethodModel.findOne({ name: oldName });
    if (!method) {
      throw new NotFoundException('Payment method not found');
    }

    if (dto.name && dto.name !== oldName) {
      const conflict = await this.paymentMethodModel.findOne({
        name: dto.name,
      });
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

      const monthlyDocs = await this.monthlySummaryModel.find({
        $or: [
          { [`initial_balance.${oldName}`]: { $exists: true } },
          { [`final_balance.${oldName}`]: { $exists: true } },
        ],
      });

      for (const doc of monthlyDocs) {
        let modified = false;
        if (doc.initial_balance && doc.initial_balance[oldName] !== undefined) {
          doc.initial_balance[dto.name] = doc.initial_balance[oldName];
          delete doc.initial_balance[oldName];
          doc.markModified('initial_balance');
          modified = true;
        }
        if (doc.final_balance && doc.final_balance[oldName] !== undefined) {
          doc.final_balance[dto.name] = doc.final_balance[oldName];
          delete doc.final_balance[oldName];
          doc.markModified('final_balance');
          modified = true;
        }
        if (modified) {
          await doc.save();
        }
      }
    }
  }

  async remove(name: string): Promise<void> {
    const method = await this.paymentMethodModel.findOne({ name });
    if (!method) {
      throw new NotFoundException('Payment method not found');
    }
    const latestSummary = await this.monthlySummaryModel
      .findOne()
      .sort({ year: -1, month: -1 })
      .lean();
    if (
      latestSummary &&
      latestSummary.final_balance &&
      latestSummary.final_balance[name] !== undefined &&
      latestSummary.final_balance[name] !== 0
    ) {
      throw new BadRequestException(
        'Cannot delete. The balance for this method is not zero.',
      );
    }
    method.is_active = false;
    await method.save();
  }
}
