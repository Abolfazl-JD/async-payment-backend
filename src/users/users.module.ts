import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { AdminUsersController } from './controllers/admin-users.controller';
import { TransactionsModule } from 'src/transactions/transactions.module';

@Module({
  imports: [TransactionsModule],
  providers: [UsersService],
  controllers: [AdminUsersController],
  exports: [UsersService],
})
export class UsersModule {}
