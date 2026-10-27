import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { OrderStatus } from '@/common/enums/order.enum';

export class GetMyOrdersQueryDto {
  @ApiPropertyOptional({
    description: 'Trang hiện tại (bắt đầu từ 1)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Trang phải là số nguyên' })
  @Min(1, { message: 'Trang tối thiểu là 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Số lượng đơn hàng mỗi trang',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số lượng mỗi trang phải là số nguyên' })
  @Min(1, { message: 'Số lượng mỗi trang tối thiểu là 1' })
  @Max(50, { message: 'Số lượng mỗi trang tối đa là 50' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái đơn hàng',
    enum: OrderStatus,
    example: OrderStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(OrderStatus, {
    message: `Trạng thái phải là một trong: ${Object.values(OrderStatus).join(', ')}`,
  })
  status?: OrderStatus;
}

export class AdminGetOrdersQueryDto extends GetMyOrdersQueryDto {
  @ApiPropertyOptional({
    description: 'Tìm kiếm theo mã đơn hàng, tên khách, số điện thoại hoặc email',
    example: 'ORD-261028',
  })
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo ID người dùng',
    example: 'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
  })
  @IsOptional()
  @IsUUID('4', { message: 'userId phải là UUID v4 hợp lệ' })
  userId?: string;

  @ApiPropertyOptional({
    description: 'Từ ngày (định dạng ISO-8601)',
    example: '2026-10-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'fromDate phải là chuỗi ngày hợp lệ ISO-8601' })
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Đến ngày (định dạng ISO-8601)',
    example: '2026-10-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'toDate phải là chuỗi ngày hợp lệ ISO-8601' })
  toDate?: string;
}
