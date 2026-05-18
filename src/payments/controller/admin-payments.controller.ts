import {
  Body,
  Controller,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from '../payments.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {
  BadReqErrorResponse,
  CreateBaseResponse,
  Roles,
  RolesGuard,
  UnprocessableEntityErrorResponse,
} from 'src/common';
import { UserRole } from '@prisma/client';
import { CreatePaymentDto } from '../dto/request';

@Controller('admin/payments')
@ApiTags('Admin payments')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBadRequestResponse({
  description: 'body validation error',
  type: BadReqErrorResponse,
})
export class AdminPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('users/:userId')
  @ApiCreatedResponse({
    description:
      'new payment for user was created successfully. wait for queue process',
    type: CreateBaseResponse,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Idempotency key already exists',
    type: UnprocessableEntityErrorResponse,
  })
  async create(
    @Body() dto: CreatePaymentDto,
    @Param('userId') userId: string,
  ): Promise<CreateBaseResponse> {
    await this.paymentsService.processNewPayment(dto, userId);

    return {
      statusCode: HttpStatus.CREATED,
    };
  }
}
