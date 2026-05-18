import { ApiResponseProperty, ApiSchema } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';

@ApiSchema()
export class PaymentResponseDto {
  id: string;
  idempotencyKey: string;
  userId: string;

  @ApiResponseProperty({
    example: '100',
    type: 'string',
  })
  amount: Prisma.Decimal;

  reference: string;
  description: string | null;
  status: string;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}
