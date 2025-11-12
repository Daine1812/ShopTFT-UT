import { Controller, Post, Body, ValidationPipe, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Public } from '../auth/decorators/public.decorator'; // Đảm bảo đã import

@Controller('auth') // API gốc là /auth
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Endpoint Đăng ký (Gửi OTP)
   * POST /auth/register
   */
  @Post('/register')
  @Public() // <-- Đảm bảo có dòng này
  register(@Body(new ValidationPipe()) registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  // === DÁN TIẾP PHẦN 2 VÀO ĐÂY ===

  /**
   * Endpoint Xác thực Email (Kích hoạt tài khoản)
   * POST /auth/verify-email
   */
  @Post('/verify-email')
  @Public() // <-- Đảm bảo có dòng này
  verifyEmail(@Body(new ValidationPipe()) verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  /**
   * Endpoint Đăng nhập
   * POST /auth/login
   */
  @Post('/login')
  @Public() // <-- Đảm bảo có dòng này
  async login(@Body(new ValidationPipe()) loginUserDto: LoginUserDto) {
    const user = await this.authService.validateUser(loginUserDto.email, loginUserDto.password);
    return this.authService.login(user);
  }
}
// === HẾT PHẦN 2 ===