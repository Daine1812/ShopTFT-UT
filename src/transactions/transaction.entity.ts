import {
  Entity,
  ObjectIdColumn,
  Column,
  CreateDateColumn,
  ObjectId,
} from 'typeorm';

/**
 * Loại Giao Dịch
 */
export enum TransactionType {
  DEPOSIT = 'deposit', // User nạp tiền
  PURCHASE = 'purchase', // User mua hàng
}

/**
 * MỚI: Trạng thái Giao Dịch
 */
export enum TransactionStatus {
  PENDING = 'pending',     // Đang chờ Admin duyệt (cho nạp tiền)
  COMPLETED = 'completed', // Đã hoàn thành
  CANCELLED = 'cancelled', // Đã hủy
}

/**
 * Bảng (Collection) lưu lại toàn bộ lịch sử giao dịch
 */
@Entity()
export class Transaction {
  @ObjectIdColumn()
  _id: ObjectId;

  /**
   * ID của người dùng thực hiện giao dịch
   */
  @Column({ type: 'string' })
  userId: string;
// === DÁN TIẾP PHẦN 2 VÀO ĐÂY ===

  /**
   * Loại giao dịch: "deposit" (nạp) hoặc "purchase" (mua)
   */
  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  /**
   * Số tiền giao dịch
   */
  @Column({ type: 'double' })
  amount: number;

  /**
   * (Tùy chọn) ID của sản phẩm đã mua
   */
  @Column({ type: 'string', nullable: true })
  productId: string | null;

  /**
   * MỚI: Trạng thái
   */
  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED, // Mặc định là hoàn thành
  })
  status: TransactionStatus;


  @CreateDateColumn()
  createdAt: Date;
} // <-- Dấu } cuối cùng của file