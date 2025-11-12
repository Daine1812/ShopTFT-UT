import { IsEmail, IsNotEmpty, IsString, MinLength, Validate, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

// Custom Validator để kiểm tra 2 mật khẩu có khớp không
@ValidatorConstraint({ name: 'matchesPassword', async: false })
export class MatchesPasswordConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    return value === relatedValue;
  }

  defaultMessage(args: ValidationArguments) {
    // Trả về thông báo lỗi
    return `Mật khẩu và mật khẩu xác nhận không khớp`;
  }
}

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên không được để trống' })
  name: string;
  
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu xác nhận không được để trống' })
  @Validate(MatchesPasswordConstraint, ['password'], { // So sánh với trường 'password'
    message: 'Mật khẩu và mật khẩu xác nhận không khớp'
  })
  confirmPassword: string;
}