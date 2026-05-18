import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles, RolesGuard } from 'src/common';
import { TransactionsService } from '../transactions.service';
import { TransactionPeriodEnum } from '../enum';
import { AggregateTransactionsResponseDto } from '../dto/response';

@Controller('admin/transactions')
@ApiTags('Admin transactions')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminTransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('aggregate')
  @ApiQuery({
    name: 'period',
    required: true,
    default: TransactionPeriodEnum.MONTHLY,
    enum: TransactionPeriodEnum,
  })
  @ApiOkResponse({
    description: 'Transactions aggregated by period',
    type: AggregateTransactionsResponseDto,
  })
  async aggregateTransactions(
    @Query('period') period: TransactionPeriodEnum,
  ): Promise<AggregateTransactionsResponseDto> {
    const result = await this.transactionsService.aggregateTransactions(period);

    return {
      statusCode: HttpStatus.OK,
      result,
    };
  }
}
