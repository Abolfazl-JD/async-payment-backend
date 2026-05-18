import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { UsersPaymentsController } from './controller/user-payments.controller';
import { PaymentProcessor } from './payment.processor';
import { UsersModule } from 'src/users/users.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { RmqModule } from 'src/common';
import { AdminPaymentsController } from './controller/admin-payments.controller';
import { PaymentStateService } from './payment-state.service';

@Module({
  imports: [RmqModule, UsersModule, TransactionsModule],
  controllers: [UsersPaymentsController, AdminPaymentsController],
  providers: [PaymentsService, PaymentProcessor, PaymentStateService],
})
export class PaymentsModule {}
