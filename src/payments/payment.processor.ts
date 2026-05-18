import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventType, PaymentRequest } from '@prisma/client';
import {
  BusinessError,
  InsufficientFundsError,
  PaymentForcedFailureError,
  PrismaService,
  RedisService,
  RmqService,
  TechnicalError,
} from '../common';
import { PAYMENT_QUEUE } from './constants';
import { PaymentsService } from './payments.service';
import { UsersService } from '../users/users.service';
import { TransactionsService } from '../transactions/transactions.service';
import { PaymentProcessorDto } from './dto/request';
import { PaymentStateService } from './payment-state.service';

@Injectable()
export class PaymentProcessor implements OnModuleInit {
  private readonly logger = new Logger(PaymentProcessor.name);

  constructor(
    private readonly rmqService: RmqService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly paymentsService: PaymentsService,
    private readonly usersService: UsersService,
    private readonly transactionsService: TransactionsService,
    private readonly paymentStateService: PaymentStateService,
  ) {}

  async onModuleInit() {
    // queue retry handling function
    this.rmqService.setRetryLogger(async (data) => {
      if (data.finalFail) {
        await this.paymentStateService.transitionToFailed(
          data.paymentRequestId,
          `retry exceeded, error=${data.error}`,
        );
      } else {
        await this.paymentsService.createEvent(
          data.paymentRequestId,
          EventType.RETRY_TRIGGERED,
          `retry=${data.retryCount} error=${data.error}`,
        );
      }
    });

    await this.rmqService.consume<PaymentProcessorDto>(
      PAYMENT_QUEUE,
      async (msg: { paymentRequestId: string }) => {
        await this.handle(msg.paymentRequestId);
      },
    );
  }

  async handle(paymentRequestId: string) {
    this.logger.log({
      event: 'PAYMENT_PROCESSING_STARTED',
      paymentRequestId,
    });

    try {
      await this.redis.performExclusively(
        `payment:${paymentRequestId}`,
        async () => {
          const payment = await this.paymentsService.findById(paymentRequestId);

          if (!payment) {
            return;
          }

          await this.paymentStateService.transitionToProcessing(
            paymentRequestId,
          );

          await this.validatePayment(payment);

          await this.processSuccessfulPayment(payment);

          this.logger.log({
            event: 'PAYMENT_PROCESSING_SUCCEEDED',
            paymentRequestId,
          });
        },
      );
    } catch (error) {
      if (error instanceof BusinessError) {
        this.logger.warn({
          event: 'BUSINESS_FAILURE',
          paymentRequestId,
          code: error.code,
          message: error.message,
        });

        await this.paymentStateService.transitionToFailed(
          paymentRequestId,
          error.message,
        );

        return;
      }

      this.logger.error({
        event: 'TECHNICAL_FAILURE',
        paymentRequestId,
        error: error?.message,
      });

      throw error;
    }
  }

  private async validatePayment(payment: PaymentRequest) {
    if (payment.reference.includes('FAIL')) {
      throw new PaymentForcedFailureError();
    }

    const amount = Number(payment.amount);

    const user = await this.usersService.findById(payment.userId);
    if (!user) {
      throw new BusinessError(
        'User not found for payment processing',
        'USER_NOT_FOUND',
      );
    }

    const userBalance = Number(user.balance);

    if (userBalance < amount) {
      throw new InsufficientFundsError();
    }
  }

  private async processSuccessfulPayment(payment: PaymentRequest) {
    await this.prisma.$transaction(async (tx) => {
      const balanceUpdated = await this.usersService.decrementBalance(
        payment.userId,
        Number(payment.amount),
        tx,
      );

      if (!balanceUpdated) {
        throw new TechnicalError(
          'Balance update failed',
          'BALANCE_UPDATE_FAILED',
        );
      }

      await this.transactionsService.createDebitTransaction(
        {
          userId: payment.userId,
          paymentRequestId: payment.id,
          amount: payment.amount,
          reference: payment.reference,
        },
        tx,
      );

      await this.paymentStateService.transitionToSucceeded(payment.id, tx);
    });
  }
}
