import { AppError } from './app.error';

export class BusinessError extends AppError {
  constructor(message: string, code: string) {
    super(message, code);
  }
}
