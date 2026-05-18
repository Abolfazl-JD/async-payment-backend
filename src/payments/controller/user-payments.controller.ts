import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
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
  UnprocessableEntityErrorResponse,
  User,
} from 'src/common';
import { CreatePaymentDto } from '../dto/request';

@Controller('users/payments')
@ApiTags("User's payments")
@ApiBearerAuth()
@ApiBadRequestResponse({
  description: 'body validation error',
  type: BadReqErrorResponse,
})
export class UsersPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'new payment was created successfully. wait for queue process',
    type: CreateBaseResponse,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Idempotency key already exists',
    type: UnprocessableEntityErrorResponse,
  })
  async create(
    @Body() dto: CreatePaymentDto,
    @User('id') userId: string,
  ): Promise<CreateBaseResponse> {
    await this.paymentsService.processNewPayment(dto, userId);

    return {
      statusCode: HttpStatus.CREATED,
    };
  }
}
