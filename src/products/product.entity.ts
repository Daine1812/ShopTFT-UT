import {
  Entity,
  ObjectIdColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ObjectId,
} from 'typeorm';

export enum ProductStatus {
  AVAILABLE = 'available',
  SOLD = 'sold',
}

// === THÊM MỚI: Danh mục sản phẩm ===
export enum ProductCategory {
  TFT = 'tft',
  LOL = 'lol',
  LIENQUAN = 'lienquan',
}
// ======================================

@Entity()
export class Product {
  @ObjectIdColumn()
  _id: ObjectId;

  // === THÊM MỚI: Cột Danh mục ===
  @Column({
    type: 'enum',
    enum: ProductCategory,
    nullable: false, // Bắt buộc phải có danh mục
  })
  category: ProductCategory;
  // ==============================

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  image: string; // URL to the image

  @Column({ type: 'double' })
  price: number;

  @Column()
  accountUsername: string;

  @Column()
  accountPassword?: string;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.AVAILABLE,
  })
  status: ProductStatus;

  @Column({ nullable: true })
  ownerId?: string;

  @Column({ type: 'string' })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}