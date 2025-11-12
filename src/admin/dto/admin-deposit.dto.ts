import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class AdminDepositDto {
  /**
   * ID (dạng string) của người dùng cần nạp tiền
   */
  @IsString()
  @IsNotEmpty({ message: 'userId không được để trống' })
  userId: string;

  /**
   * Số tiền cần nạp
   */
  @IsNumber()
  @Min(10000, { message: 'Số tiền nạp phải ít nhất 10,000' })
  amount: number;
}