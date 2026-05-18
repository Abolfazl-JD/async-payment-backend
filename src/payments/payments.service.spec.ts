import { EventType, PaymentStatus } from '@prisma/client';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const prismaMock = {
    $transaction: jest.fn(),
    paymentRequest: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    paymentEvent: {
      create: jest.fn(),
    },
  };

  const rmqServiceMock = {
    publish: jest.fn(),
  };

  const redisServiceMock = {
    performExclusively: jest.fn((_, fn) => fn()),
  };

  const paymentStateServiceMock = {
    transitionToQueued: jest.fn(),
    transitionToProcessing: jest.fn(),
    transitionToSucceeded: jest.fn(),
    transitionToFailed: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new PaymentsService(
      prismaMock as any,
      rmqServiceMock as any,
      redisServiceMock as any,
      paymentStateServiceMock as any,
    );
  });

  describe('createEvent', () => {
    it('should create payment event', async () => {
      prismaMock.paymentEvent.create.mockResolvedValue({ id: 'event-id' });

      await service.createEvent('payment-id', EventType.CREATED, 'created');

      expect(prismaMock.paymentEvent.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateStatus', () => {
    it('should update payment status', async () => {
      prismaMock.paymentRequest.update.mockResolvedValue({
        id: 'payment-id',
      });

      await service.updateStatus('payment-id', PaymentStatus.SUCCEEDED);

      expect(prismaMock.paymentRequest.update).toHaveBeenCalledWith({
        where: { id: 'payment-id' },
        data: {
          status: PaymentStatus.SUCCEEDED,
          failureReason: undefined,
        },
      });
    });
  });

  describe('findById', () => {
    it('should return payment', async () => {
      prismaMock.paymentRequest.findUnique.mockResolvedValue({
        id: 'payment-id',
      });

      const result = await service.findById('payment-id');

      expect(result).toEqual({ id: 'payment-id' });
    });
  });
});
