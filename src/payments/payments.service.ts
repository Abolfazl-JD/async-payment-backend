import {
  forwardRef,
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService, RedisService, RmqService } from '../common';
import { CreatePaymentDto } from './dto/request';
import { PaymentStatus, EventType, Prisma } from '@prisma/client';
import { PAYMENT_QUEUE } from './constants';
import { PaymentStateService } from './payment-state.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rmqService: RmqService,
    private readonly redisService: RedisService,
    @Inject(forwardRef(() => PaymentStateService))
    private paymentStateService: PaymentStateService,
  ) {}

  async processNewPayment(dto: CreatePaymentDto, userId: string) {
    const lockKey = `user:${userId}:payment`;

    return this.redisService.performExclusively(lockKey, async () => {
      const payment = await this.prisma.$transaction(async (tx) => {
        await this.validateIdempotencyKey(dto.idempotencyKey, tx);

        const payment = await this.createNew(dto, userId, tx);

        await this.paymentStateService.transitionToQueued(payment.id, tx);
        return payment;
      });

      await this.rmqService.publish(PAYMENT_QUEUE, {
        paymentRequestId: payment.id,
      });
    });
  }

  async createNew(
    dto: CreatePaymentDto,
    userId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;

    const payment = await db.paymentRequest.create({
      data: {
        userId,
        amount: dto.amount,
        reference: dto.reference,
        description: dto.description,
        idempotencyKey: dto.idempotencyKey,
        status: PaymentStatus.PENDING,
      },
    });

    await this.createEvent(
      payment.id,
      EventType.CREATED,
      `Payment ${payment.id} created`,
      tx,
    );

    return payment;
  }

  async updateStatus(
    paymentId: string,
    status: PaymentStatus,
    tx?: Prisma.TransactionClient,
    failureReason?: string,
  ) {
    const db = tx ?? this.prisma;

    return db.paymentRequest.update({
      where: { id: paymentId },
      data: {
        status,
        failureReason,
      },
    });
  }

  async findById(paymentId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.paymentRequest.findUnique({
      where: {
        id: paymentId,
      },
    });
  }

  async createEvent(
    paymentRequestId: string,
    type: EventType,
    message?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;

    return db.paymentEvent.create({
      data: {
        paymentRequestId,
        type,
        message,
      },
    });
  }

  private async validateIdempotencyKey(
    idempotencyKey: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;
    const exists = await db.paymentRequest.findUnique({
      where: {
        idempotencyKey,
      },
    });

    if (exists) {
      throw new UnprocessableEntityException('Idempotency key already exists');
    }
  }
}
