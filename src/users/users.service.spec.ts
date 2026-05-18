import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  const prismaMock = {
    $transaction: jest.fn(),
    user: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  const redisMock = {
    performExclusively: jest.fn(),
  };

  const transactionsServiceMock = {
    createCreditTransaction: jest.fn(),
    getUserCreditsAmount: jest.fn(),
    getUserDebitsAmount: jest.fn(),
  };

  beforeEach(() => {
    service = new UsersService(
      prismaMock as never,
      redisMock as never,
      transactionsServiceMock as never,
    );

    jest.clearAllMocks();
  });

  describe('creditBalance', () => {
    it('should throw if user not found', async () => {
      redisMock.performExclusively.mockImplementation(async (_key, callback) =>
        callback(),
      );

      prismaMock.$transaction.mockImplementation(async (callback) =>
        callback({
          user: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        }),
      );

      await expect(service.creditBalance('user-id', 100)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should increment balance and create transaction', async () => {
      const updateMock = jest.fn();

      redisMock.performExclusively.mockImplementation(async (_key, callback) =>
        callback(),
      );

      prismaMock.$transaction.mockImplementation(async (callback) =>
        callback({
          user: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'user-id',
            }),

            update: updateMock,
          },
        }),
      );

      await service.creditBalance('user-id', 100);

      expect(updateMock).toHaveBeenCalled();

      expect(
        transactionsServiceMock.createCreditTransaction,
      ).toHaveBeenCalled();
    });
  });

  describe('decrementBalance', () => {
    it('should return true if balance updated', async () => {
      prismaMock.user.updateMany.mockResolvedValue({
        count: 1,
      });

      const result = await service.decrementBalance('user-id', 50);

      expect(result).toBe(true);
    });

    it('should return false if no rows updated', async () => {
      prismaMock.user.updateMany.mockResolvedValue({
        count: 0,
      });

      const result = await service.decrementBalance('user-id', 50);

      expect(result).toBe(false);
    });
  });

  describe('getUserBalanceUsage', () => {
    it('should return balance usage report', async () => {
      transactionsServiceMock.getUserCreditsAmount.mockResolvedValue({
        _sum: {
          amount: new Prisma.Decimal(500),
        },
      });

      transactionsServiceMock.getUserDebitsAmount.mockResolvedValue({
        _sum: {
          amount: new Prisma.Decimal(200),
        },
      });

      jest.spyOn(service, 'findById').mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        balance: new Prisma.Decimal(300),
        createdAt: new Date(),
      });

      const result = await service.getUserBalanceUsage('user-id');

      expect(result.totalCredits).toEqual(new Prisma.Decimal(500));

      expect(result.totalDebits).toEqual(new Prisma.Decimal(200));
    });
  });
});
