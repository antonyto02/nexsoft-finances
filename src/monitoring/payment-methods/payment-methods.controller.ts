import { Body, Controller, Get, Post, Patch, Param } from '@nestjs/common';
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@Controller('monitoring/payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Get()
  async findAll() {
    const data = await this.paymentMethodsService.findAll();
    return { data };
  }

  @Post()
  async create(@Body() dto: CreatePaymentMethodDto) {
    const data = await this.paymentMethodsService.create(dto);
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
}
