import { IsNumber, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

// === DÁN TIẾP PHẦN 2 VÀO ĐÂY ===

export class DepositDto {
  /**
   * ĐÃ SỬA LỖI:
   * 1. @IsNumber() - Phải là số.
   * 2. @IsPositive() - Phải là số dương.
   * 3. @Min(10000) - Phải lớn hơn hoặc bằng 10.000.
   * 4. @Type(() => Number) - Tự động chuyển chuỗi (string) từ JSON sang số (number).
   */
  @IsNumber({}, { message: 'Số tiền phải là một con số.' })
  @IsPositive({ message: 'Số tiền phải là số dương.' })
  @Min(10000, { message: 'Số tiền nạp tối thiểu là 10,000 VND.' })
  @Type(() => Number)
  amount: number;
}
// === HẾT PHẦN 2 ===