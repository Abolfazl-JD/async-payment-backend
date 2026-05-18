import { ApiResponseProperty, ApiSchema } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';

@ApiSchema()
export class TransctionResponseDto {
  id: string;
  userId: string;

  @ApiResponseProperty({
    example: '100',
    type: 'string',
  })
  amount: Prisma.Decimal;

  reference: string;
  paymentRequestId: string | null;
  type: string;
  createdAt: Date;
}
