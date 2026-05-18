import { Injectable } from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../common';
import { TransactionPeriodEnum } from './enum';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createDebitTransaction(
    params: {
      userId: string;
      paymentRequestId: string;
      amount: Prisma.Decimal;
      reference: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;

    return db.transaction.create({
      data: {
        userId: params.userId,
        paymentRequestId: params.paymentRequestId,
        amount: params.amount,
        reference: params.reference,
        type: TransactionType.DEBIT,
      },
    });
  }

  async createCreditTransaction(
    params: {
      userId: string;
      amount: Prisma.Decimal;
      reference: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;

    return db.transaction.create({
      data: {
        userId: params.userId,
        amount: params.amount,
        reference: params.reference,
        type: TransactionType.CREDIT,
      },
    });
  }

  async aggregateTransactions(period: TransactionPeriodEnum) {
    let dateFormat = '';

    switch (period) {
      case TransactionPeriodEnum.DAILY:
        dateFormat = 'YYYY-MM-DD';
        break;

      case TransactionPeriodEnum.MONTHLY:
        dateFormat = 'YYYY-MM';
        break;

      case TransactionPeriodEnum.YEARLY:
        dateFormat = 'YYYY';
        break;
    }

    const result = await this.prisma.$queryRaw<
      Array<{
        period: string;
        type: string;
        total: string;
      }>
    >`
    SELECT
      TO_CHAR("createdAt", ${dateFormat}) as period,
      type,
      SUM(amount)::text as total
    FROM "Transaction"
    GROUP BY period, type
    ORDER BY period DESC
  `;

    return result;
  }

  async getUserCreditsAmount(userId: string) {
    return this.prisma.transaction.aggregate({
      where: {
        userId,
        type: 'CREDIT',
      },
      _sum: {
        amount: true,
      },
    });
  }

  async getUserDebitsAmount(userId: string) {
    return this.prisma.transaction.aggregate({
      where: {
        userId,
        type: 'DEBIT',
      },
      _sum: {
        amount: true,
      },
    });
  }
}
