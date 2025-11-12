// src/transactions/transactions.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { Transaction, TransactionType, TransactionStatus } from './transaction.entity';
import { User } from '../users/users.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: MongoRepository<Transaction>,
  ) {}

// === DÁN TIẾP PHẦN 2 VÀO ĐÂY ===

  /**
   * (ĐÃ NÂNG CẤP) Tạo một giao dịch mới
   * Thêm productId và status
   */
  async createTransaction(
    user: User,
    type: TransactionType,
    amount: number,
    productId: string | null = null, // Thêm productId, mặc định là null
    status: TransactionStatus = TransactionStatus.COMPLETED, // Thêm status, mặc định là Hoàn thành
  ): Promise<Transaction> {
    
    const newTransaction = this.transactionsRepository.create({
      userId: user._id.toString(), // Lưu ID của user (dạng string)
      type,
      amount,
      productId, // Lưu ID sản phẩm (nếu có)
      status,    // Lưu trạng thái (pending hoặc completed)
    });

    return this.transactionsRepository.save(newTransaction);
  }
} // <-- Dấu } cuối cùng của file
// === HẾT PHẦN 2 ===