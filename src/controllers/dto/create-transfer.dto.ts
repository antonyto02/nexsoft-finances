import { IsDateString, IsIn, IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateTransferDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['transfer', 'pay'])
  type: string;

  @IsString()
  @IsNotEmpty()
  from: string;

  @IsString()
  @IsNotEmpty()
  to: string;

  @IsNumber()
  @IsPositive()
  amount: number;
}
