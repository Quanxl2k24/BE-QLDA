import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdateCartItemDto {
  @ApiPropertyOptional({
    description: 'ID của CartItem (UUID v4) nếu không truyền trên URL param',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'cartItemId phải là định dạng UUID v4 hợp lệ' })
  cartItemId?: string;

  @ApiPropertyOptional({
    description:
      'ID của biến thể sản phẩm (UUID v4) nếu không truyền trên URL param',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'variantId phải là định dạng UUID v4 hợp lệ' })
  variantId?: string;

  @ApiProperty({
    description:
      'Số lượng mới của sản phẩm trong giỏ hàng (tối thiểu là 0; nếu bằng 0 sẽ xóa sản phẩm khỏi giỏ hàng)',
    example: 2,
    minimum: 0,
  })
  @IsNotEmpty({ message: 'quantity không được để trống' })
  @Type(() => Number)
  @IsInt({ message: 'quantity phải là số nguyên' })
  @Min(0, { message: 'Số lượng sản phẩm tối thiểu là 0' })
  quantity!: number;
}
