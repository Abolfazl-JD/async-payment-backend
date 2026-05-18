import { BusinessError } from './business.error';

export class InsufficientFundsError extends BusinessError {
  constructor() {
    super('Insufficient funds', 'INSUFFICIENT_FUNDS');
  }
}
