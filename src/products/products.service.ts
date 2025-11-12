import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository, FindOptionsWhere } from 'typeorm';
import { Product, ProductStatus, ProductCategory } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { User } from '../users/users.entity';
import { ObjectId } from 'mongodb';
import { UsersService } from '../users/users.service';
import { TransactionsService } from '../transactions/transactions.service';
import {
  TransactionType,
  TransactionStatus,
} from '../transactions/transaction.entity';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: MongoRepository<Product>,
    private usersService: UsersService,
    private transactionsService: TransactionsService,
  ) {}

  /**
   * Tạo sản phẩm (Admin)
   */
  async createProduct(
    createProductDto: CreateProductDto,
    admin: User,
    file: Express.Multer.File,
  ): Promise<Product> {
    const {
      category,
      name,
      description,
      price,
      accountUsername,
      accountPassword,
    } = createProductDto;

    const imageUrl = `http://localhost:3000/uploads/${file.filename}`;

    const newProduct = this.productsRepository.create({
      category,
      name,
      description,
      price,
      image: imageUrl,
      accountUsername,
      accountPassword,
      status: ProductStatus.AVAILABLE,
      createdById: admin._id.toString(),
    });

    return this.productsRepository.save(newProduct);
  }

  /**
   * Cập nhật sản phẩm (Admin)
   */
  async updateProduct(
    id: string,
    updateDto: CreateProductDto,
    file?: Express.Multer.File,
  ): Promise<Product> {
    // === SỬA: Dùng hàm public mới ===
    const product = await this.getProductByIdAdmin(id);
    // =============================

    const oldImageUrl = product.image;

    product.category = updateDto.category;
    product.name = updateDto.name;
    product.description = updateDto.description;
    product.price = updateDto.price;
    product.accountUsername = updateDto.accountUsername;
    product.accountPassword = updateDto.accountPassword;

    if (file) {
      product.image = `http://localhost:3000/uploads/${file.filename}`;
      if (oldImageUrl) {
        try {
          const oldFileName = oldImageUrl.split('/uploads/')[1];
          await unlink(join(__dirname, '..', 'public', 'uploads', oldFileName));
        } catch (e) {
          console.warn(`Không thể xóa file cũ: ${oldImageUrl}`, e.message);
        }
      }
    }
    return this.productsRepository.save(product);
  }

  /**
   * Lấy tất cả sản phẩm (Public)
   */
  async getProducts(category?: ProductCategory): Promise<Product[]> {
    const whereClause: FindOptionsWhere<Product> = {
      status: ProductStatus.AVAILABLE,
    };

    if (category) {
      whereClause.category = category;
    }

    return this.productsRepository.find({
      where: whereClause,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Lấy 1 sản phẩm (Public)
   */
  async getProductById(id: string): Promise<Product> {
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      throw new NotFoundException(`ID sản phẩm "${id}" không hợp lệ.`);
    }

    const product = await this.productsRepository.findOne({
      where: { _id: objectId },
    });

    if (!product) {
      throw new NotFoundException(`Sản phẩm với ID "${id}" không tồn tại.`);
    }
    
    // Ẩn thông tin nhạy cảm
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { category, accountUsername, accountPassword, ...publicProduct } = product;
    return publicProduct as Product;
  }

  /**
   * Xóa sản phẩm (Admin)
   */
  async deleteProduct(id: string): Promise<void> {
    // === SỬA: Dùng hàm public mới ===
    const product = await this.getProductByIdAdmin(id);
    // =============================
    if (product.image) {
      try {
        const oldFileName = product.image.split('/uploads/')[1];
        await unlink(join(__dirname, '..', 'public', 'uploads', oldFileName));
      } catch (e) {
        console.warn(`Không thể xóa file ảnh: ${product.image}`, e.message);
      }
    }
    const result = await this.productsRepository.delete({ _id: product._id });
    if (result.affected === 0) {
      throw new NotFoundException(`Sản phẩm với ID "${id}" không tồn tại.`);
    }
  }

  /**
   * API MUA NGAY
   */
  async buyProduct(
    productId: string,
    buyer: User,
  ): Promise<{ message: string; product: Product }> {
    // === SỬA: Dùng hàm public mới ===
    const product = await this.getProductByIdAdmin(productId);
    // =============================

    if (product.status === ProductStatus.SOLD) {
      throw new BadRequestException('Sản phẩm này đã được bán.');
    }
    if (buyer.balance < product.price) {
      throw new ForbiddenException('Bạn không đủ số dư để mua sản phẩm này.');
    }
    const userToUpdate = await this.usersService.findById(buyer._id);
    if (!userToUpdate) {
      throw new NotFoundException('Không tìm thấy người mua.');
    }

    userToUpdate.balance =
      parseFloat(userToUpdate.balance.toString()) - product.price;

    product.status = ProductStatus.SOLD;
    product.ownerId = userToUpdate._id.toString();

    await this.transactionsService.createTransaction(
      userToUpdate,
      TransactionType.PURCHASE,
      product.price,
      product._id.toString(),
      TransactionStatus.COMPLETED,
    );

    await this.usersService.save(userToUpdate);
    await this.productsRepository.save(product);

    return {
      message: 'Mua hàng thành công!',
      product: product,
    };
  }

  // === SỬA: Đổi "private" thành "public" và đổi tên ===
  /**
   * Lấy data đầy đủ (cả username/pass) của 1 sản phẩm
   * Dùng cho Admin (Sửa) và logic Mua hàng
   */
  public async getProductByIdAdmin(id: string): Promise<Product> {
  // ======================================================
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      throw new NotFoundException(`ID sản phẩm "${id}" không hợp lệ.`);
    }
    const product = await this.productsRepository.findOne({
      where: { _id: objectId },
    });
    if (!product) {
      throw new NotFoundException(`Sản phẩm với ID "${id}" không tồn tại.`);
    }
    return product;
  }
}