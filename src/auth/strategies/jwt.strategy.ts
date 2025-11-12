// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service'; // Import UsersService
import { User } from '../../users/users.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService, // 1. "Tiêm" UsersService vào đây
  ) {
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_SECRET không được định nghĩa trong .env');
    }

    super({
      // 2. Chỉ định cách lấy Token từ Header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }



  /**
   * Hàm này sẽ chạy MỖI KHI CÓ API GỌI CẦN TOKEN
   * Nó sẽ lấy payload từ token (đã giải mã) và tìm User trong DB
   */
  async validate(payload: { email: string; sub: string; name: string }): Promise<User> {
    
    // 3. Tìm user trong DB bằng ID (lấy từ "sub" của token)
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Token không hợp lệ hoặc người dùng không tồn tại.');
    }

    // 4. KIỂM TRA: User có bị khóa (isActive: false) không?
    if (!user.isActive) {
        throw new UnauthorizedException('Tài khoản chưa được kích hoạt.');
    }

    // 5. TRẢ VỀ: Đối tượng User (đã loại bỏ các trường nhạy cảm)
    // Decorator @GetUser() trong Controller sẽ nhận được kết quả này
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, otp, otpExpires, ...result } = user;
    
    return result as User;
  }
} // <-- Dấu } cuối cùng của file