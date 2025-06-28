import { Body, Controller, Post } from '@nestjs/common';
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';

@Controller('monitoring/payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Post()
  async create(@Body() dto: CreatePaymentMethodDto) {
    const data = await this.paymentMethodsService.create(dto);
    return {
      message: 'Payment method created successfully',
      data,
    };
  }
}
