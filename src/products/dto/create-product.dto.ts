import { Type } from 'class-transformer';
// === SỬA: Import thêm IsEnum và IsNotEmpty ===
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum, // <-- THÊM
} from 'class-validator';
// === SỬA: Import thêm ProductCategory ===
import { ProductCategory } from '../product.entity';
// ======================================

export class CreateProductDto {
  // === THÊM MỚI: Trường Category ===
  @IsEnum(ProductCategory) // Phải là 1 trong các giá trị 'tft', 'lol', 'lienquan'
  @IsNotEmpty()
  category: ProductCategory;
  // ==============================

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @Type(() => Number)
  @IsNumber()
  price: number;

  @IsString()
  @IsNotEmpty()
  accountUsername: string;

  @IsString()
  @IsOptional()
  accountPassword?: string;
}