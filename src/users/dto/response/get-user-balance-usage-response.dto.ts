import { ApiResponseProperty, ApiSchema } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { OKBaseResponse } from 'src/common';

export class GetUserBalanceUsageResponseDto extends OKBaseResponse {
  result: BalanceUserReport;
}

@ApiSchema()
class BalanceUserReport {
  @ApiResponseProperty({
    example: '100',
    type: 'string',
  })
  totalCredits: number | Prisma.Decimal;
  @ApiResponseProperty({
    example: '100',
    type: 'string',
  })
  totalDebits: number | Prisma.Decimal;
  @ApiResponseProperty({
    example: '100',
    type: 'string',
  })
  currentBalance: number | Prisma.Decimal;
}
