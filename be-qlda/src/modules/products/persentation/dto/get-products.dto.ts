import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ProductStatus } from '@/common/enums/product.enum';

export class GetProductsCursorDto {
  @ApiPropertyOptional({
    description:
      'ID (UUID) của sản phẩm làm mốc phân trang (lấy từ nextCursor của lần gọi trước). Bỏ trống nếu là trang đầu tiên.',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Cursor phải là UUID v4 hợp lệ' })
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Số lượng sản phẩm cần lấy trên mỗi trang (1 - 100)',
    default: 10,
    example: 10,
    minimum: 1,
    maximum: 100,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit phải là số nguyên' })
  @Min(1, { message: 'Limit tối thiểu là 1' })
  @Max(100, { message: 'Limit tối đa là 100' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description:
      'Lọc danh sách sản phẩm theo đường dẫn thân thiện (slug) của danh mục',
    example: 'banh-trung-thu',
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'categorySlug phải là chuỗi' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  categorySlug?: string;

  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm theo tên hoặc thương hiệu sản phẩm',
    example: 'Bánh Trung Thu',
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({
    description:
      'Lọc theo trạng thái sản phẩm (ACTIVE, INACTIVE, DRAFT, ARCHIVED)',
    enum: ProductStatus,
    example: ProductStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ProductStatus, { message: 'Trạng thái sản phẩm không hợp lệ' })
  status?: ProductStatus;
}
