import {
  Controller,
  Get,
  Put,
  Body,
  ValidationPipe,
  Post,
} from '@nestjs/common';
import { User } from './users.entity';
import { Role } from './role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { DepositDto } from './dto/deposit.dto';

@Controller('api/user')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('/me')
  getMe(@GetUser() user: User) {
    console.log('[UsersController] API /me được gọi, User:', user.email);
    return user;
  }

  @Put('/me')
  updateMe(
    @GetUser() user: User,
    @Body(new ValidationPipe()) updateProfileDto: UpdateProfileDto,
  ) {
    console.log(`[UsersController] API /me (PUT) được gọi bởi: ${user.email}`);
    return this.usersService.updateProfile(user, updateProfileDto);
  }

  @Put('/me/password')
  updatePassword(
    @GetUser() user: User,
    @Body(new ValidationPipe()) updatePasswordDto: UpdatePasswordDto,
  ) {
    console.log(`[UsersController] API /me/password (PUT) được gọi bởi: ${user.email}`);
    return this.usersService.updatePassword(user, updatePasswordDto);
  }

  @Post('/me/deposit')
  deposit(
    @GetUser() user: User,
    @Body(new ValidationPipe()) depositDto: DepositDto,
  ) {
    console.log(`[UsersController] API /me/deposit (POST) được gọi bởi: ${user.email}`);
    // Đổi sang hàm mới
    return this.usersService.createDepositRequest(user, depositDto);
  }

  // ==========================================================
  // === SỬA LỖI: ĐÃ THÊM TRY...CATCH ĐỂ BẮT LỖI GỬI MAIL ===
  // ==========================================================
  /**
   * API Xử lý khi user bấm "Tôi đã chuyển khoản"
   */
  @Post('/me/notify-deposit')
  async notifyDeposit(
    @GetUser() user: User,
    @Body() body: { amount: number },
  ) {
    console.log(
      `[UsersController] API /me/notify-deposit (POST) được gọi bởi: ${user.email}`,
    );
    console.log(`Số tiền user báo đã nạp: ${body.amount}`);

    try {
      // 1. Thử gọi UsersService
      const result = await this.usersService.notifyAdminOfDeposit(
        user,
        body.amount,
      );
      // 2. Nếu service thành công, trả về kết quả
      return result;
    } catch (error) {
      // 3. Nếu service (gửi mail) có lỗi, nó sẽ bị bắt ở đây
      console.error(
        '[UsersController] LỖI khi gọi UsersService.notifyAdminOfDeposit:',
        error.message, // In ra thông báo lỗi
      );

      // 4. Ném lỗi này ra để frontend biết là đã thất bại
      // (Nếu không ném, frontend sẽ tưởng là "thành công")
      throw error;
    }
  }
  // ==========================================================
  // === KẾT THÚC PHẦN SỬA LỖI ===
  // ==========================================================

  // --- CÁC ROUTE TEST ---
  @Roles(Role.ADMIN)
  @Get('/admin-test')
  testAdminRoute(@GetUser() user: User) {
    return { message: `Chào admin ${user.name}!` };
  }

  @Public()
  @Get('/public')
  publicRoute() {
    return { message: 'Đây là route công khai.' };
  }
}