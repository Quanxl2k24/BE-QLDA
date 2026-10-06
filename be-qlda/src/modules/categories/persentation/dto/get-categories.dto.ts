import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class CategoriesDto {
  @ApiPropertyOptional({
    description:
      'ID (UUID) của category làm mốc phân trang (lấy từ nextCursor của lần gọi trước). Bỏ trống nếu là trang đầu.',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Cursor phải là UUID hợp lệ' })
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Số lượng bản ghi cần lấy trên mỗi trang (1 - 100)',
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
}
