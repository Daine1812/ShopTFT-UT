import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { AuthModule } from '../auth/auth.module';

// === THÊM 2 MODULE MỚI ===
import { UsersModule } from '../users/users.module';
import { TransactionsModule } from '../transactions/transactions.module';
// ===========================

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    AuthModule,
    
    // === THÊM VÀO IMPORTS ===
    UsersModule, // Để dùng UsersService
    TransactionsModule, // Để dùng TransactionsService
    // ========================
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}