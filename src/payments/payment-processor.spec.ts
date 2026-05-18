import { PaymentProcessor } from './payment.processor';

describe('PaymentProcessor', () => {
  let processor: PaymentProcessor;

  const rmqMock = {
    setRetryLogger: jest.fn(),
    consume: jest.fn(),
  };

  const prismaMock = {
    $transaction: jest.fn((cb) => cb({})),
  };

  const redisMock = {
    performExclusively: jest.fn((_, fn) => fn()),
  };

  const paymentsServiceMock = {
    findById: jest.fn(),
    updateStatus: jest.fn(),
    createEvent: jest.fn(),
  };

  const paymentStateServiceMock = {
    transitionToProcessing: jest.fn(),
    transitionToSucceeded: jest.fn(),
    transitionToFailed: jest.fn(),
  };

  const usersServiceMock = {
    findById: jest.fn(),
    decrementBalance: jest.fn(),
  };

  const transactionsServiceMock = {
    createDebitTransaction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    processor = new PaymentProcessor(
      rmqMock as any,
      prismaMock as any,
      redisMock as any,
      paymentsServiceMock as any,
      usersServiceMock as any,
      transactionsServiceMock as any,
      paymentStateServiceMock as any,
    );
  });

  describe('handle', () => {
    it('should fail on FORCE failure reference', async () => {
      paymentsServiceMock.findById.mockResolvedValue({
        id: 'payment-id',
        reference: 'FAIL_X',
      });

      await processor.handle('payment-id');

      expect(paymentStateServiceMock.transitionToFailed).toHaveBeenCalled();
    });

    it('should fail on insufficient funds', async () => {
      paymentsServiceMock.findById.mockResolvedValue({
        id: 'payment-id',
        userId: 'user-id',
        amount: 500,
        reference: 'PAYMENT',
      });

      usersServiceMock.findById.mockResolvedValue({
        balance: 100,
      });

      await processor.handle('payment-id');

      expect(paymentStateServiceMock.transitionToFailed).toHaveBeenCalledWith(
        'payment-id',
        expect.any(String),
      );
    });

    it('should process successful payment', async () => {
      paymentsServiceMock.findById.mockResolvedValue({
        id: 'payment-id',
        userId: 'user-id',
        amount: 100,
        reference: 'OK',
      });

      usersServiceMock.findById.mockResolvedValue({
        balance: 500,
      });

      usersServiceMock.decrementBalance.mockResolvedValue(true);

      await processor.handle('payment-id');

      expect(
        paymentStateServiceMock.transitionToSucceeded,
      ).toHaveBeenCalledWith('payment-id', expect.anything());

      expect(transactionsServiceMock.createDebitTransaction).toHaveBeenCalled();
    });
  });
});
