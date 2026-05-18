import { IsOptional, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  amount: string;

  @IsString()
  reference: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  idempotencyKey: string;
}
