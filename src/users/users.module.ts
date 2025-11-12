import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';
import { TransactionsModule } from '../transactions/transactions.module';

// === THÊM VÀO (1/3): Import 3 Entity cần dùng ===
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule } from '@nestjs/config';
import { Transaction } from '../transactions/transaction.entity'; // <-- THÊM
import { Product } from '../products/product.entity'; // <-- THÊM
// ===============================================

@Module({
  imports: [
    // === SỬA (2/3): Đăng ký User, Transaction, Product entities ===
    TypeOrmModule.forFeature([User, Transaction, Product]), // <-- CẬP NHẬT
    // ==========================================================
    forwardRef(() => AuthModule),
    TransactionsModule,
    MailerModule,
    ConfigModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}