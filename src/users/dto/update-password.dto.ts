import { IsNotEmpty, IsString, MinLength, Validate } from 'class-validator';
import { MatchesPasswordConstraint } from '../../auth/dto/register-user.dto'; // Tái sử dụng Validator từ file register

export class UpdatePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu cũ không được để trống' })
  oldPassword: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  newPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu xác nhận không được để trống' })
  @Validate(MatchesPasswordConstraint, ['newPassword'], {
    // So sánh với trường 'newPassword'
    message: 'Mật khẩu mới và mật khẩu xác nhận không khớp',
  })
  confirmNewPassword: string;
}