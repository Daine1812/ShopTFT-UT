import { Entity, ObjectIdColumn, Column, ObjectId } from 'typeorm';
import { Role } from './role.enum';

@Entity()
export class User {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.CUSTOMER,
  })
  role: Role;

  @Column({
    type: 'double',
    default: 0,
  })
  balance: number;
// === DÁN TIẾP PHẦN 2 VÀO ĐÂY ===

  @Column({ nullable: true })
  name: string;

  @Column({ default: false })
  isActive: boolean;

  @Column({ nullable: true })
  otp: string | null;

  @Column({ type: 'timestamp', nullable: true })
  otpExpires: Date | null;

  // ĐÃ SỬA LỖI: Dùng kiểu 'text' để chấp nhận chuỗi Base64 rất dài
  @Column({ type: 'text', nullable: true }) 
  avatar: string | null;

}
// === HẾT PHẦN 2 ===