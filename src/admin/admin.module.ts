import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/users.entity';
import { TransactionsModule } from '../transactions/transactions.module';

// === SỬA (1/2): Import thêm 2 entity ===
import { Transaction } from '../transactions/transaction.entity';
import { Product } from '../products/product.entity';
// ===================================

@Module({
  imports: [
    // === SỬA (2/2): Thêm Transaction và Product vào mảng forFeature ===
    TypeOrmModule.forFeature([User, Transaction, Product]),
    // ==========================================================
    
    TransactionsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}