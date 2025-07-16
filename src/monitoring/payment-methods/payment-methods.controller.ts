import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Headers,
} from '@nestjs/common';
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { extractCompanyId } from '../../utils/token';

@Controller('monitoring/payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Get()
  async findAll(@Headers('authorization') auth?: string) {
    const companyId = extractCompanyId(auth);
    const data = await this.paymentMethodsService.findAll(companyId);
    return { data };
  }

  @Post()
  async create(
    @Body() dto: CreatePaymentMethodDto,
    @Headers('authorization') auth?: string,
  ) {
    const companyId = extractCompanyId(auth);
    const data = await this.paymentMethodsService.create(dto, companyId);
    return {
      message: 'Payment method created successfully',
      data,
    };
  }

  @Patch(':oldName')
  async update(
    @Param('oldName') oldName: string,
    @Body() dto: UpdatePaymentMethodDto,
  ) {
    await this.paymentMethodsService.update(oldName, dto);
    return { message: 'Payment method updated successfully' };
  }

  @Delete(':name')
  async remove(@Param('name') name: string) {
    await this.paymentMethodsService.remove(name);
    return { message: 'Payment method deleted successfully' };
  }
}
