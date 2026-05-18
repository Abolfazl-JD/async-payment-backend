import { ApiResponseProperty, ApiSchema } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { PaymentResponseDto } from 'src/payments/dto/response';
import { TransctionResponseDto } from 'src/transactions/dto/response';

@ApiSchema()
export class UserResponseDto {
  id: string;
  email: string;

  @ApiResponseProperty({
    example: '100',
    type: 'string',
  })
  balance: Prisma.Decimal;
  createdAt: Date;
}

@ApiSchema()
export class FullUserResponseDto extends UserResponseDto {
  transactions: TransctionResponseDto[];
  paymentRequests: PaymentResponseDto[];
}
