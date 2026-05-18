import { BusinessError } from './business.error';

export class PaymentForcedFailureError extends BusinessError {
  constructor() {
    super('Forced payment failure', 'FORCED_FAILURE');
  }
}
