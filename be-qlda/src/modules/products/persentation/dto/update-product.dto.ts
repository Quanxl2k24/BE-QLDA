import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ProductStatus } from '@/common/enums/product.enum';

export class UpdateProductVariantDto {
  @ApiPropertyOptional({
    description: 'ID của biến thể nếu cập nhật biến thể đã tồn tại (để trống nếu muốn thêm mới biến thể)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID biến thể phải là định dạng UUID v4' })
  id?: string;

  @ApiPropertyOptional({
    description: 'Mã SKU của biến thể',
    example: 'BANH-TT-THAP-CAM-150G',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'SKU phải là chuỗi' })
  @MaxLength(100, { message: 'SKU không được vượt quá 100 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  sku?: string;

  @ApiPropertyOptional({
    description: 'Tên biến thể sản phẩm',
    example: 'Bánh Thập Cẩm 150g',
    maxLength: 150,
  })
  @IsOptional()
  @IsString({ message: 'Tên biến thể phải là chuỗi' })
  @MaxLength(150, { message: 'Tên biến thể không được vượt quá 150 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @ApiPropertyOptional({
    description: 'Giá bán của biến thể',
    example: 85000,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Giá bán phải là số' })
  @Min(0, { message: 'Giá bán không được nhỏ hơn 0' })
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional({
    description: 'Giá gốc trước khi giảm',
    example: 95000,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Giá gốc phải là số' })
  @Min(0, { message: 'Giá gốc không được nhỏ hơn 0' })
  @Type(() => Number)
  originalPrice?: number;

  @ApiPropertyOptional({
    description: 'Khối lượng sản phẩm (gram)',
    example: 150,
  })
  @IsOptional()
  @IsInt({ message: 'Khối lượng phải là số nguyên' })
  @Min(0, { message: 'Khối lượng không được nhỏ hơn 0' })
  @Type(() => Number)
  weight?: number;

  @ApiPropertyOptional({
    description: 'Số lượng tồn kho',
    example: 100,
  })
  @IsOptional()
  @IsInt({ message: 'Số lượng tồn kho phải là số nguyên' })
  @Min(0, { message: 'Số lượng tồn kho không được nhỏ hơn 0' })
  @Type(() => Number)
  stock?: number;

  @ApiPropertyOptional({
    description: 'Trạng thái biến thể',
    example: 'ACTIVE',
    maxLength: 30,
  })
  @IsOptional()
  @IsString({ message: 'Trạng thái phải là chuỗi' })
  @MaxLength(30, { message: 'Trạng thái không được vượt quá 30 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  status?: string;
}

export class UpdateProductDto {
  @ApiPropertyOptional({
    description: 'Tên sản phẩm',
    example: 'Bánh Trung Thu Kinh Đô Thập Cẩm',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Tên sản phẩm phải là chuỗi' })
  @MaxLength(255, { message: 'Tên sản phẩm không được vượt quá 255 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @ApiPropertyOptional({
    description: 'Đường dẫn thân thiện (slug)',
    example: 'banh-trung-thu-kinh-do-thap-cam',
    maxLength: 280,
  })
  @IsOptional()
  @IsString({ message: 'Slug phải là chuỗi' })
  @MaxLength(280, { message: 'Slug không được vượt quá 280 ký tự' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  slug?: string;

  @ApiPropertyOptional({
    description: 'ID danh mục sản phẩm',
    example: 'b1e8e8e2-624d-4df4-8d4e-d007c082531a',
  })
  @IsOptional()
  @IsUUID('4', { message: 'categoryId phải là định dạng UUID v4' })
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Mô tả chi tiết sản phẩm',
    example: 'Bánh nướng trung thu thập cẩm lạp xưởng truyền thống',
  })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({
    description: 'Thương hiệu sản phẩm',
    example: 'Kinh Đô',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Thương hiệu phải là chuỗi' })
  @MaxLength(100, { message: 'Thương hiệu không được vượt quá 100 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  brand?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái sản phẩm (ACTIVE, INACTIVE, DRAFT, ARCHIVED)',
    enum: ProductStatus,
    example: ProductStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ProductStatus, { message: 'Trạng thái sản phẩm không hợp lệ' })
  status?: ProductStatus;

  @ApiPropertyOptional({
    description: 'Danh sách các biến thể cập nhật hoặc thêm mới',
    type: [UpdateProductVariantDto],
  })
  @IsOptional()
  @IsArray({ message: 'Danh sách biến thể phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => UpdateProductVariantDto)
  variants?: UpdateProductVariantDto[];
}
