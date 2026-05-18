import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService, RedisService } from '../common';
import { UserRole } from '@prisma/client';
import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async creditBalance(userId: string, amount: number) {
    const lockKey = `user:balance:${userId}`;

    return this.redisService.performExclusively(lockKey, async () => {
      return this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new NotFoundException('User not found');
        }

        await tx.user.update({
          where: { id: userId },
          data: {
            balance: {
              increment: new Prisma.Decimal(amount),
            },
          },
        });

        await this.transactionsService.createCreditTransaction(
          {
            userId: user.id,
            amount: new Prisma.Decimal(amount),
            reference: `ADMIN_CREDIT_${Date.now()}`,
          },
          tx,
        );
      });
    });
  }

  async decrementBalance(
    userId: string,
    amount: number,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;

    const updated = await db.user.updateMany({
      where: {
        id: userId,
        balance: {
          gte: amount,
        },
      },

      data: {
        balance: {
          decrement: amount,
        },
      },
    });

    return updated.count > 0;
  }

  createUser(email: string, password: string) {
    return this.prisma.user.create({
      data: {
        role: UserRole.USER,
        email,
        password,
        balance: new Prisma.Decimal(0),
      },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  findById(id: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
        balance: true,
        createdAt: true,
      },
    });
  }

  async getUsersBalances(skip = 0, take = 10) {
    return this.prisma.user.findMany({
      skip,
      take,
      where: {
        role: UserRole.USER,
      },
      select: {
        id: true,
        email: true,
        balance: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getUserAccountDetails(userId: string) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        balance: true,
        createdAt: true,

        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
        },

        paymentRequests: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async getUserBalanceUsage(userId: string) {
    const credits = await this.transactionsService.getUserCreditsAmount(userId);

    const debits = await this.transactionsService.getUserDebitsAmount(userId);

    const user = await this.findById(userId);

    return {
      totalCredits: credits._sum.amount ?? 0,
      totalDebits: debits._sum.amount ?? 0,
      currentBalance: user?.balance ?? 0,
    };
  }
}
