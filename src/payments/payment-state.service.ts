import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { EventType, PaymentStatus, Prisma } from '@prisma/client';

import { PaymentsService } from './payments.service';

@Injectable()
export class PaymentStateService {
  constructor(
    @Inject(forwardRef(() => PaymentsService))
    private paymentsService: PaymentsService,
  ) {}

  async transitionToQueued(paymentId: string, tx?: Prisma.TransactionClient) {
    await this.paymentsService.updateStatus(
      paymentId,
      PaymentStatus.QUEUED,
      tx,
    );

    await this.paymentsService.createEvent(
      paymentId,
      EventType.QUEUED,
      `Payment ${paymentId} queued`,
      tx,
    );
  }

  async transitionToProcessing(
    paymentId: string,
    tx?: Prisma.TransactionClient,
  ) {
    await this.paymentsService.updateStatus(
      paymentId,
      PaymentStatus.PROCESSING,
      tx,
    );

    await this.paymentsService.createEvent(
      paymentId,
      EventType.PROCESSING_STARTED,
      `Payment ${paymentId} processing started`,
      tx,
    );
  }

  async transitionToSucceeded(
    paymentId: string,
    tx?: Prisma.TransactionClient,
  ) {
    await this.paymentsService.updateStatus(
      paymentId,
      PaymentStatus.SUCCEEDED,
      tx,
    );

    await this.paymentsService.createEvent(
      paymentId,
      EventType.SUCCEEDED,
      `Payment ${paymentId} succeeded`,
      tx,
    );
  }

  async transitionToFailed(
    paymentId: string,
    reason: string,
    tx?: Prisma.TransactionClient,
  ) {
    // guard for duplicate failures
    const payment = await this.paymentsService.findById(paymentId);

    if (!payment || payment.status === PaymentStatus.SUCCEEDED) {
      return;
    }

    await this.paymentsService.updateStatus(
      paymentId,
      PaymentStatus.FAILED,
      tx,
      reason,
    );

    await this.paymentsService.createEvent(
      paymentId,
      EventType.FAILED,
      reason,
      tx,
    );
  }
}
