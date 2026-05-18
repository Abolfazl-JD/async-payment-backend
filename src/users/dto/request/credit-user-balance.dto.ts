import { IsNumber, IsPositive } from 'class-validator';

export class CreditUserBalanceDto {
  @IsNumber()
  @IsPositive()
  amount: number;
}
