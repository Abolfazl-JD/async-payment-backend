import { AppError } from './app.error';

export class TechnicalError extends AppError {
  constructor(message: string, code: string) {
    super(message, code);
  }
}
