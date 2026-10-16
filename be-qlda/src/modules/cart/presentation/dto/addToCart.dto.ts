import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({
    description: 'ID của biến thể sản phẩm (UUID v4)',
    example: 'c4e4bf7e-07a8-48b2-b13c-0e2bbd8e0556',
  })
  @IsNotEmpty({ message: 'variantId không được để trống' })
  @IsUUID('4', { message: 'variantId phải là định dạng UUID v4 hợp lệ' })
  variantId!: string;

  @ApiProperty({
    description: 'Số lượng sản phẩm muốn thêm vào giỏ hàng (tối thiểu là 1)',
    example: 1,
    minimum: 1,
  })
  @IsNotEmpty({ message: 'quantity không được để trống' })
  @Type(() => Number)
  @IsInt({ message: 'quantity phải là số nguyên' })
  @Min(1, { message: 'Số lượng thêm vào giỏ hàng tối thiểu phải là 1' })
  quantity!: number;
}
