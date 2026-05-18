import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { AdminTransactionsController } from './controller/admin-transactions.controller';

@Module({
  controllers: [AdminTransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
