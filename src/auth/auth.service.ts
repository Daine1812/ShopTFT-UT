import { Injectable, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcrypt';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private readonly mailerService: MailerService,
    private jwtService: JwtService,
  ) {}

  /**
   * HÀM ĐĂNG KÝ (Gửi OTP)
   */
  async register(registerUserDto: RegisterUserDto) {
    const { email, name } = registerUserDto;

    const existingUser = await this.usersService.findByEmail(email);
    
    if (existingUser && existingUser.isActive) {
      throw new ConflictException('Email đã tồn tại');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // Hết hạn sau 10 phút

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(registerUserDto.password, salt);
    const hashedOtp = await bcrypt.hash(otp, salt); 

    let userToSave;
    if (existingUser && !existingUser.isActive) {
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.otp = hashedOtp;
      existingUser.otpExpires = otpExpires;
      userToSave = existingUser;
    } else {
      userToSave = await this.usersService.create(
        registerUserDto,
        hashedPassword,
        hashedOtp,
        otpExpires,
      );
    }
    
    await this.usersService.save(userToSave);

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: '[ShopTFT] Mã xác thực tài khoản của bạn',
        text: `Chào ${name},\n\nMã OTP của bạn là: ${otp}\n\nMã này sẽ hết hạn sau 10 phút.`,
      });
    } catch (error) {
      console.error('Không gửi được email:', error);
      throw new BadRequestException('Không thể gửi email xác thực. Vui lòng thử lại.');
    }

    return {
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
    };
  }

  /**
   * HÀM XÁC THỰC EMAIL (Kích hoạt tài khoản)
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, otp } = verifyEmailDto;
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Email không tồn tại.');
    }

    if (user.isActive) {
        throw new BadRequestException('Tài khoản này đã được kích hoạt.');
    }

    // --- SỬA LỖI Ở ĐÂY ---
    // 3. Kiểm tra OTP và Hạn OTP
    // Phải kiểm tra cả hai xem có null không
    if (!user.otp || !user.otpExpires) {
      throw new BadRequestException('Không tìm thấy mã OTP. Vui lòng đăng ký lại.');
    }

    // 4. Kiểm tra OTP hết hạn
    if (user.otpExpires < new Date()) {
      throw new BadRequestException('Mã OTP đã hết hạn. Vui lòng đăng ký lại.');
    }

    // 5. Kiểm tra OTP
    // Sau 2 bước trên, TypeScript đã biết user.otp là 'string', không phải 'null'
    const isOtpMatching = await bcrypt.compare(otp, user.otp);
    if (!isOtpMatching) {
      throw new BadRequestException('Mã OTP không chính xác.');
    }
    // --- KẾT THÚC SỬA LỖI ---

    // Kích hoạt user
    user.isActive = true;
    user.otp = null; 
    user.otpExpires = null; 
    await this.usersService.save(user);

    return this.login(user);
}

  /**
   * HÀM HỖ TRỢ ĐĂNG NHẬP (Kiểm tra mật khẩu)
   */
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
        throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (!user.isActive) {
        throw new UnauthorizedException('Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email.');
    }

    const isPasswordMatching = await bcrypt.compare(pass, user.password);
    if (isPasswordMatching) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, otp, otpExpires, ...result } = user;
      return result; 
    }
    
    throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
  }
  
  /**
   * HÀM TẠO TOKEN (Sau khi đăng nhập/xác thực)
   */
  async login(user: any) {
    const payload = { 
        email: user.email, 
        sub: user._id.toString(), 
        role: user.role, 
        name: user.name 
    };
    return {
      message: 'Đăng nhập thành công',
      user: payload,
      access_token: this.jwtService.sign(payload),
    };
  }
}