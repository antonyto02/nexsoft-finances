import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Headers,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MonthlySummaryService } from '../monitoring/monthly-summary/monthly-summary.service';
import { Transaction, TransactionDocument } from '../transactions/transaction.schema';
import { PaymentMethod, PaymentMethodDocument } from '../monitoring/payment-methods/payment-method.schema';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { extractCompanyId } from '../utils/token';

@Controller('finances/transfers')
export class TransferController {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(PaymentMethod.name)
    private readonly paymentMethodModel: Model<PaymentMethodDocument>,
    private readonly monthlySummaryService: MonthlySummaryService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateTransferDto,
    @Headers('authorization') auth?: string,
  ) {
    const companyId = extractCompanyId(auth);
    if (dto.type !== 'transfer' && dto.type !== 'pay') {
      throw new BadRequestException('Invalid type');
    }

    if (dto.from === dto.to) {
      throw new BadRequestException('from and to must be different');
    }

    if (dto.amount <= 0) {
      throw new BadRequestException('amount must be greater than zero');
    }

    const fromExists = await this.paymentMethodModel.exists({ name: dto.from });
    const toExists = await this.paymentMethodModel.exists({ name: dto.to });
    if (!fromExists || !toExists) {
      throw new BadRequestException('Invalid payment methods');
    }

    const date = new Date(dto.date);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date');
    }

    const category = dto.type === 'transfer' ? 'Transferencia' : 'Pago de TDC';
    const conceptPrefix = dto.type === 'transfer' ? 'Transferencia a ' : 'Pago a ';
    const concept = `${conceptPrefix}${dto.to}`;

    const transaction = new this.transactionModel({
      date,
      type: 'expense',
      category,
      amount: dto.amount,
      method: dto.from,
      concept,
      company_id: companyId,
    });
    const saved = await transaction.save();

    const updatedMonths = await this.monthlySummaryService.registerTransfer({
      date,
      from: dto.from,
      to: dto.to,
      amount: dto.amount,
      company_id: companyId,
    });

    return {
      message: 'Transferencia registrada y balances actualizados.',
      movement_id: saved._id.toString(),
      updated_months: updatedMonths,
    };
  }
}
