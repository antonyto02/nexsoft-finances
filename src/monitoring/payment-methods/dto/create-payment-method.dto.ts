import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreatePaymentMethodDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['cash', 'debit', 'credit'])
  type: string;
}
