import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { OrderStatus } from '@/common/enums/order.enum';
import { Transform } from 'class-transformer';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'Trạng thái mới của đơn hàng',
    enum: OrderStatus,
    example: OrderStatus.CONFIRMED,
  })
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsEnum(OrderStatus, {
    message: `Trạng thái phải là một trong: ${Object.values(OrderStatus).join(', ')}`,
  })
  status!: OrderStatus;

  @ApiPropertyOptional({
    description: 'Ghi chú lý do chuyển đổi trạng thái',
    example: 'Đã xác nhận đơn hàng qua điện thoại',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  @MaxLength(500, { message: 'Ghi chú không được vượt quá 500 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  note?: string;
}

export class CancelOrderDto {
  @ApiPropertyOptional({
    description: 'Lý do hủy đơn hàng',
    example: 'Muốn đổi sang sản phẩm khác',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Lý do hủy đơn phải là chuỗi' })
  @MaxLength(500, { message: 'Lý do hủy không được vượt quá 500 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  reason?: string;
}
