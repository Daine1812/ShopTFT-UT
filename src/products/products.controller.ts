import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Get,
  Param,
  Put,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { User } from '../users/users.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/role.enum';
import { Public } from '../auth/decorators/public.decorator';
import { GetProductsDto } from './dto/get-products.dto';

export const multerOptions = {
  // ... (Phần này đã đúng, giữ nguyên)
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException('Chỉ hỗ trợ file ảnh (jpg, jpeg, png, gif)!'),
        false,
      );
    }
  },
  storage: diskStorage({
    destination: './public/uploads',
    filename: (req, file, cb) => {
      const randomName = Array(32)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');
      cb(null, `${randomName}${extname(file.originalname)}`);
    },
  }),
};

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image', multerOptions))
  createProduct(
    @UploadedFile() file: Express.Multer.File,
    @Body(new ValidationPipe({ transform: true }))
    createProductDto: CreateProductDto,
    @GetUser() admin: User,
  ) {
    if (!file) {
      throw new BadRequestException('File ảnh là bắt buộc!');
    }
    return this.productsService.createProduct(createProductDto, admin, file);
  }

  @Put('/:id')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image', multerOptions))
  updateProduct(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body(new ValidationPipe({ transform: true })) updateDto: CreateProductDto,
  ) {
    return this.productsService.updateProduct(id, updateDto, file);
  }

  @Post('/buy/:id')
  buyProduct(@Param('id') id: string, @GetUser() user: User) {
    return this.productsService.buyProduct(id, user);
  }

  @Get()
  @Public()
  getProducts(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: GetProductsDto,
  ) {
    return this.productsService.getProducts(query.category);
  }

  @Get('/:id')
  @Public()
  getProductById(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  // ==========================================================
  // === ROUTE MỚI: LẤY DATA ADMIN CỦA 1 SẢN PHẨM ===
  // ==========================================================
  @Get('/admin/:id')
  @Roles(Role.ADMIN) // Chỉ Admin
  getProductByIdAdmin(@Param('id') id: string) {
    // Gọi hàm public chúng ta vừa sửa ở service
    return this.productsService.getProductByIdAdmin(id);
  }
  // ==========================================================

  @Delete('/:id')
  @Roles(Role.ADMIN)
  deleteProduct(@Param('id') id: string) {
    this.productsService.deleteProduct(id);
    return { message: `Đã xóa thành công sản phẩm ${id}` };
  }
}