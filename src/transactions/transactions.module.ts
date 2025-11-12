import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [
    // 1. Đăng ký Transaction Entity
    TypeOrmModule.forFeature([Transaction]),
  ],
  providers: [TransactionsService],
  // 2. EXPORT (Xuất) TransactionsService ra
  //    Để UsersService (ở module khác) có thể "tiêm" và sử dụng
  exports: [TransactionsService],
})
export class TransactionsModule {}