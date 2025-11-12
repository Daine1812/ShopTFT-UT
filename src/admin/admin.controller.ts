import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Get,
  Param,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminDepositDto } from './dto/admin-deposit.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/role.enum';
// === THÊM IMPORT GetUser và User ===
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/users.entity';
// =================================

@Controller('api/admin')
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  /**
   * API Admin Nạp Tiền cho User bất kỳ
   */
  @Post('/deposit')
  adminDeposit(
    @Body(new ValidationPipe()) adminDepositDto: AdminDepositDto,
  ) {
    return this.adminService.depositForUser(adminDepositDto);
  }

  /**
   * API Admin Xem Thống Kê Doanh Thu
   */
  @Get('/revenue')
  getRevenueStats() {
    return this.adminService.getRevenueStats();
  }

  /**
   * API Admin Lấy các đơn nạp tiền đang chờ
   */
  @Get('/pending-deposits')
  getPendingDeposits() {
    return this.adminService.getPendingDeposits();
  }

  /**
   * API Admin Duyệt 1 đơn nạp tiền
   */
  @Post('/approve-deposit/:id')
  approveDeposit(@Param('id') id: string) {
    return this.adminService.approveDeposit(id);
  }

  // ==========================================================
  // === ROUTE MỚI 1: TOOL TẠO SẢN PHẨM (SEEDER) ===
  // ==========================================================
  @Get('/seed-products')
  seedProducts(@GetUser() admin: User) {
    return this.adminService.seedProducts(admin);
  }

  // ==========================================================
  // === ROUTE MỚI 2: LẤY TẤT CẢ SẢN PHẨM (CHO ADMIN) ===
  // ==========================================================
  @Get('/all-products')
  getAllProducts() {
    return this.adminService.getAllProducts();
  }
}