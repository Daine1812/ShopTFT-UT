import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entity';
import { MongoRepository } from 'typeorm';
import { RegisterUserDto } from '../auth/dto/register-user.dto';
import * as bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { DepositDto } from './dto/deposit.dto';
import { Role } from './role.enum';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionType, TransactionStatus } from '../transactions/transaction.entity';
import { MailerService } from '@nestjs-modules/mailer';

// === SỬA (1/3): Import ConfigService ===
import { ConfigService } from '@nestjs/config';
// ======================================

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: MongoRepository<User>,
    private transactionsService: TransactionsService,
    private mailerService: MailerService,
    
    // === SỬA (2/3): Inject ConfigService ===
    private configService: ConfigService,
    // ======================================
  ) {}

  /**
   * Tạo user mới với mật khẩu và OTP đã hash
   */
  async create(
    registerUserDto: RegisterUserDto,
    hashedPassword: string,
    hashedOtp: string,
    otpExpires: Date,
  ): Promise<User> {
    const { name, email } = registerUserDto;

    const user = this.usersRepository.create({
      name, email, password: hashedPassword, isActive: false,
      balance: 0, role: Role.CUSTOMER, avatar: null,
      otp: hashedOtp, otpExpires: otpExpires,
    });

    try {
      await this.usersRepository.save(user);
      return user;
    } catch (error) {
      if (error.code === 11000) { throw new ConflictException('Email đã tồn tại'); } 
      else { throw new InternalServerErrorException(); }
    }
  }

  /**
   * Cập nhật thông tin (Tên, Avatar)
   */
  async updateProfile(
    user: User, // User lấy từ Token (có _id)
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    
    const dataToUpdate: { name?: string; avatar?: string | null } = {};
    if (updateProfileDto.name) {
      dataToUpdate.name = updateProfileDto.name;
    }
    if (updateProfileDto.avatar !== undefined) {
      dataToUpdate.avatar = updateProfileDto.avatar && updateProfileDto.avatar.trim() !== '' 
        ? updateProfileDto.avatar 
        : null;
    }
    
    if (Object.keys(dataToUpdate).length === 0) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, otp, otpExpires, ...result } = user;
        return result as User;
    }

    try {
      await this.usersRepository.update(
        { _id: user._id }, // Điều kiện tìm
        dataToUpdate // Dữ liệu cập nhật
      );
      
      const updatedUser = await this.findById(user._id);
      if (!updatedUser) {
        throw new InternalServerErrorException('Không thể tìm thấy user sau khi cập nhật.');
      }
      
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, otp, otpExpires, ...result } = updatedUser;
      return result as User;

    } catch (e) {
        console.error('Lỗi khi lưu cập nhật profile:', e);
        throw new InternalServerErrorException('Lỗi database khi cập nhật hồ sơ.');
    }
  }

  /**
   * Cập nhật mật khẩu
   */
  async updatePassword(
    user: User,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    const { oldPassword, newPassword } = updatePasswordDto;

    const isPasswordMatching = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Mật khẩu cũ không đúng');
    }

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(newPassword, salt);

    await this.usersRepository.save(user);
    return { message: 'Đổi mật khẩu thành công' };
  }

  /**
   * Chỉ tạo giao dịch PENDING, KHÔNG CỘNG TIỀN
   */
  async createDepositRequest(
    user: User,
    depositDto: DepositDto,
  ): Promise<{ message: string }> {
    const { amount } = depositDto;
    
    await this.transactionsService.createTransaction(
      user,
      TransactionType.DEPOSIT,
      amount,
      null,
      TransactionStatus.PENDING,
    );

    return {
      message: 'Yêu cầu nạp tiền đã được ghi lại. Chờ Admin duyệt.',
    };
  }
  
  /**
   * Gửi email thông báo cho Admin khi có user báo nạp tiền
   */
  async notifyAdminOfDeposit(user: User, amount: number) {
    
    // === SỬA (3/3): Lấy ADMIN_EMAIL từ file .env ===
    const ADMIN_EMAIL = this.configService.get<string>('ADMIN_EMAIL');
    // =============================================

    if (!ADMIN_EMAIL) {
      console.error('[UsersService] LỖI: Biến ADMIN_EMAIL chưa được cài đặt trong file .env');
      throw new InternalServerErrorException('Lỗi cấu hình server (email).');
    }

    const subject = `[ShopTFT] User "${user.email}" vừa báo nạp tiền`;
    const formattedAmount = amount.toLocaleString('vi-VN');

    try {
      await this.mailerService.sendMail({
        to: ADMIN_EMAIL, // Gửi đến admin (đã lấy từ .env)
        subject: subject,
        html: `
          <h2>Yêu cầu nạp tiền mới!</h2>
          <p>Xin chào Admin,</p>
          <p>Tài khoản sau vừa thực hiện bấm "Tôi đã chuyển khoản":</p>
          <ul>
            <li><strong>Email:</strong> ${user.email}</li>
            <li><strong>Tên:</strong> ${user.name}</li>
            <li><strong>ID User:</strong> ${user._id}</li> 
            <li><strong>Số tiền báo nạp:</strong> <strong>${formattedAmount} VND</strong></li>
          </ul>
          <p>Vui lòng đăng nhập vào trang Admin để kiểm tra và xác nhận giao dịch.</p>
        `,
      });
      
      console.log(`[UsersService] Đã gửi mail thông báo nạp tiền của ${user.email} cho Admin: ${ADMIN_EMAIL}`);
      
      return { 
        message: 'Đã gửi thông báo cho Admin thành công!',
        status: 'pending_confirmation' 
      };

    } catch (error) {
      console.error(`[UsersService] LỖI khi gửi mail nạp tiền:`, error);
      throw new InternalServerErrorException('Lỗi khi gửi mail thông báo cho Admin.');
    }
  }

  // === CÁC HÀM TIỆN ÍCH (Giữ nguyên) ===

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string | ObjectId): Promise<User | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    try {
      const user = await this.usersRepository.findOne({
        where: { _id: objectId },
      });
      return user;
    } catch (error) {
      throw new BadRequestException('ID người dùng không hợp lệ');
    }
  }

  async save(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }
}