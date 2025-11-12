import { IsEnum, IsOptional } from 'class-validator';
import { ProductCategory } from '../product.entity';

export class GetProductsDto {
  @IsEnum(ProductCategory)
  @IsOptional() // Dấu ? nghĩa là 'không bắt buộc'
  category?: ProductCategory;
}