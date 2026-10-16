import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class CartTotalsQueryDto {
  @ApiPropertyOptional({
    description:
      'Danh sách cartItemId được chọn để tính tiền (nếu bỏ trống sẽ tính toàn bộ giỏ hàng)',
    example: ['c4e4bf7e-07a8-48b2-b13c-0e2bbd8e0556'],
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.includes(',')
        ? value.split(',').map((id) => id.trim())
        : [value.trim()];
    }
    return value;
  })
  @IsArray({ message: 'itemIds phải là một mảng' })
  @IsUUID('4', { each: true, message: 'Mỗi cartItemId phải là UUID v4 hợp lệ' })
  itemIds?: string[];
}
