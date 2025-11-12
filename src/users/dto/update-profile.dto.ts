import { IsString, IsOptional, MinLength } from 'class-validator';

// === DÁN TIẾP PHẦN 2 VÀO ĐÂY ===

export class UpdateProfileDto {
  @IsString({ message: 'Tên phải là chuỗi' })
  @MinLength(3, { message: 'Tên phải có ít nhất 3 ký tự' })
  @IsOptional() // Cho phép không gửi 'name'
  name?: string;

  /**
   * ĐÃ SỬA LỖI:
   * 1. Bỏ @IsUrl() vì Base64 (data:image/...) không phải là URL.
   * 2. Chỉ cần @IsString() (vì Base64 là chuỗi) và @IsOptional().
   */
  @IsString({ message: 'Avatar phải là chuỗi' })
  @IsOptional() // Cho phép không gửi 'avatar'
  avatar?: string;
}
// === HẾT PHẦN 2 ===