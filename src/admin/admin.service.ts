import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/users.entity';
import { MongoRepository, FindOptionsWhere } from 'typeorm';
import { AdminDepositDto } from './dto/admin-deposit.dto';
import { ObjectId } from 'mongodb';
import { TransactionsService } from '../transactions/transactions.service';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../transactions/transaction.entity';
// === SỬA: Import thêm Product, ProductStatus, ProductCategory ===
import {
  Product,
  ProductStatus,
  ProductCategory,
} from '../products/product.entity';
// ==========================================================

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: MongoRepository<User>,
    @InjectRepository(Transaction)
    private transactionRepository: MongoRepository<Transaction>,
    // === SỬA: Đã inject ProductRepository (Bạn đã có) ===
    @InjectRepository(Product)
    private productRepository: MongoRepository<Product>,
    // =================================================
    private transactionsService: TransactionsService,
  ) {}

  /**
   * ADMIN: Nạp tiền vào tài khoản của User
   */
  async depositForUser(
    adminDepositDto: AdminDepositDto,
  ): Promise<{ message: string; newBalance: number }> {
    // ... (Phần này đã đúng, giữ nguyên)
    const { userId, amount } = adminDepositDto;
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(userId);
    } catch (error) {
      throw new BadRequestException('ID người dùng không hợp lệ.');
    }
    const user = await this.usersRepository.findOne({
      where: { _id: objectId },
    });
    if (!user) {
      throw new NotFoundException(`Người dùng với ID "${userId}" không tồn tại.`);
    }
    const currentBalance = parseFloat(user.balance.toString()) || 0;
    user.balance = currentBalance + amount;
    try {
      await this.usersRepository.save(user);
      await this.transactionsService.createTransaction(
        user,
        TransactionType.DEPOSIT,
        amount,
        null,
        TransactionStatus.COMPLETED,
      );
      return {
        message: `Admin đã nạp thành công ${amount.toLocaleString()}đ vào tài khoản ${
          user.name
        }.`,
        newBalance: user.balance,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Không thể cập nhật số dư người dùng.',
      );
    }
  }

  /**
   * ADMIN: Xem thống kê doanh thu và giao dịch
   */
  async getRevenueStats(): Promise<any> {
    // ... (Phần này đã đúng, giữ nguyên)
    try {
      const revenueResults = await this.transactionRepository
        .aggregate([
          {
            $match: {
              type: TransactionType.PURCHASE,
              status: TransactionStatus.COMPLETED,
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$amount' },
              totalPurchases: { $sum: 1 },
            },
          },
        ])
        .toArray();
      const totalRevenue = revenueResults[0]?.totalRevenue || 0;
      const totalPurchases = revenueResults[0]?.totalPurchases || 0;
      const totalUsers = await this.usersRepository.count({});
      return {
        totalUsers,
        summary: {
          totalRevenue,
          totalPurchases,
          currency: 'VND',
        },
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Lỗi khi lấy dữ liệu thống kê.');
    }
  }

  /**
   * HÀM LẤY ĐƠN CHỜ DUYỆT
   */
  async getPendingDeposits(): Promise<Transaction[]> {
    // ... (Phần này đã đúng, giữ nguyên)
    try {
      const pendingDeposits = await this.transactionRepository
        .aggregate([
          {
            $match: {
              type: TransactionType.DEPOSIT,
              status: TransactionStatus.PENDING,
            },
          },
          {
            $addFields: {
              userIdObj: { $toObjectId: '$userId' },
            },
          },
          {
            $lookup: {
              from: 'user',
              localField: 'userIdObj',
              foreignField: '_id',
              as: 'userDetails',
            },
          },
          {
            $unwind: {
              path: '$userDetails',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 1,
              amount: 1,
              createdAt: 1,
              status: 1,
              user: {
                _id: '$userDetails._id',
                name: '$userDetails.name',
                email: '$userDetails.email',
              },
            },
          },
          { $sort: { createdAt: 1 } },
        ])
        .toArray();

      return pendingDeposits;
    } catch (error) {
      console.error('Lỗi khi lấy pending deposits:', error);
      throw new InternalServerErrorException(
        'Lỗi server khi truy vấn đơn nạp tiền.',
      );
    }
  }

  /**
   * HÀM DUYỆT ĐƠN NẠP TIỀN
   */
  async approveDeposit(
    transactionId: string,
  ): Promise<{ message: string; newBalance: number }> {
    // ... (Phần này đã đúng, giữ nguyên)
    let transactionObjectId: ObjectId;
    try {
      transactionObjectId = new ObjectId(transactionId);
    } catch (error) {
      throw new BadRequestException('Transaction ID không hợp lệ.');
    }
    const transaction = await this.transactionRepository.findOne({
      where: { _id: transactionObjectId },
    });
    if (!transaction) {
      throw new NotFoundException('Không tìm thấy giao dịch.');
    }
    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(
        `Giao dịch này đã ở trạng thái ${transaction.status}, không thể duyệt.`,
      );
    }
    if (transaction.type !== TransactionType.DEPOSIT) {
      throw new BadRequestException('Đây không phải là giao dịch nạp tiền.');
    }
    if (!transaction.userId) {
      throw new InternalServerErrorException(
        'Giao dịch này bị lỗi, không gắn với User ID.',
      );
    }
    const user = await this.usersRepository.findOne({
      where: { _id: new ObjectId(transaction.userId) },
    });
    if (!user) {
      throw new NotFoundException(
        `Không tìm thấy user (${transaction.userId}) của giao dịch này.`,
      );
    }
    const currentBalance = parseFloat(user.balance.toString()) || 0;
    user.balance = currentBalance + transaction.amount;
    transaction.status = TransactionStatus.COMPLETED;
    try {
      await this.usersRepository.save(user);
      await this.transactionRepository.save(transaction);
      return {
        message: `Đã duyệt thành công ${transaction.amount.toLocaleString()}đ cho ${
          user.email
        }.`,
        newBalance: user.balance,
      };
    } catch (error) {
      console.error('Lỗi khi lưu duyệt nạp tiền:', error);
      throw new InternalServerErrorException('Lỗi server khi lưu giao dịch.');
    }
  }

  // ==========================================================
  // === HÀM MỚI 1: TOOL TẠO SẢN PHẨM (SEEDER) ===
  // ==========================================================
  async seedProducts(admin: User): Promise<{ message: string; count: number }> {
    console.log('[AdminService] Bắt đầu tạo sản phẩm mẫu...');
    const categories = [
      ProductCategory.TFT,
      ProductCategory.LOL,
      ProductCategory.LIENQUAN,
    ];
    const productsToCreate: Product[] = [];

    for (const category of categories) {
      for (let i = 1; i <= 10; i++) {
        const name = `Account ${category.toUpperCase()} #${i}`;
        const product = this.productRepository.create({
          category: category,
          name: name,
          description: `Đây là mô tả tự động cho ${name}.`,
          // Ảnh giữ chỗ ngẫu nhiên
          image: `https://placehold.co/400x200?text=${name.replace(' ', '+')}`,
          // Giá ngẫu nhiên từ 10,000 đến 1,000,000
          price: Math.floor(Math.random() * 990000) + 10000,
          accountUsername: `user_${category}_${i}`,
          accountPassword: `pass_${i}_${Math.random().toString(36).substring(7)}`,
          status: ProductStatus.AVAILABLE,
          createdById: admin._id.toString(),
        });
        productsToCreate.push(product);
      }
    }

    try {
      await this.productRepository.save(productsToCreate);
      console.log(`[AdminService] Đã tạo thành công ${productsToCreate.length} sản phẩm.`);
      return {
        message: 'Tạo sản phẩm mẫu thành công!',
        count: productsToCreate.length,
      };
    } catch (error) {
      console.error('[AdminService] Lỗi khi tạo sản phẩm mẫu:', error);
      throw new InternalServerErrorException('Lỗi khi tạo sản phẩm mẫu.');
    }
  }

  // ==========================================================
  // === HÀM MỚI 2: LẤY TẤT CẢ SẢN PHẨM (CHO ADMIN) ===
  // ==========================================================
  async getAllProducts(): Promise<Product[]> {
    // Lấy tất cả, kể cả 'sold', để Admin quản lý
    return this.productRepository.find({
      order: { createdAt: 'DESC' },
    });
  }
}