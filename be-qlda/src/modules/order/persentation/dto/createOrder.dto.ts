import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export enum PaymentMethod {
  COD = 'COD',
  VNPAY = 'VNPAY',
  MOMO = 'MOMO',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export class ShippingAddressDto {
  @ApiProperty({
    description: 'Họ và tên người nhận hàng',
    example: 'Nguyễn Văn A',
    maxLength: 150,
  })
  @IsNotEmpty({ message: 'Tên người nhận hàng không được để trống' })
  @IsString({ message: 'Tên người nhận hàng phải là chuỗi' })
  @MaxLength(150, { message: 'Tên người nhận không được vượt quá 150 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  recipientName!: string;

  @ApiProperty({
    description: 'Số điện thoại người nhận hàng',
    example: '0987654321',
  })
  @IsNotEmpty({ message: 'Số điện thoại người nhận không được để trống' })
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  @Matches(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, {
    message: 'Số điện thoại người nhận không đúng định dạng',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone!: string;

  @ApiProperty({
    description: 'Tỉnh / Thành phố',
    example: 'Hà Nội',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Tỉnh/Thành phố không được để trống' })
  @IsString({ message: 'Tỉnh/Thành phố phải là chuỗi' })
  @MaxLength(100, { message: 'Tỉnh/Thành phố không được vượt quá 100 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  province!: string;

  @ApiProperty({
    description: 'Quận / Huyện',
    example: 'Cầu Giấy',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Quận/Huyện không được để trống' })
  @IsString({ message: 'Quận/Huyện phải là chuỗi' })
  @MaxLength(100, { message: 'Quận/Huyện không được vượt quá 100 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  district!: string;

  @ApiProperty({
    description: 'Phường / Xã',
    example: 'Dịch Vọng',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Phường/Xã không được để trống' })
  @IsString({ message: 'Phường/Xã phải là chuỗi' })
  @MaxLength(100, { message: 'Phường/Xã không được vượt quá 100 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  ward!: string;

  @ApiProperty({
    description: 'Địa chỉ chi tiết (số nhà, tên đường, ngõ ngách)',
    example: 'Số 123 Đường Cầu Giấy',
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'Địa chỉ chi tiết không được để trống' })
  @IsString({ message: 'Địa chỉ chi tiết phải là chuỗi' })
  @MaxLength(255, { message: 'Địa chỉ chi tiết không được vượt quá 255 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  street!: string;

  @ApiPropertyOptional({
    description: 'Ghi chú thêm cho người giao hàng',
    example: 'Giao giờ hành chính, gọi trước khi đến',
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú giao hàng phải là chuỗi' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  note?: string;
}

export class CreateOrderItemDto {
  @ApiProperty({
    description: 'ID của biến thể sản phẩm (UUID v4)',
    example: 'c4e4bf7e-07a8-48b2-b13c-0e2bbd8e0556',
  })
  @IsNotEmpty({ message: 'variantId không được để trống' })
  @IsUUID('4', { message: 'variantId phải là định dạng UUID v4 hợp lệ' })
  variantId!: string;

  @ApiProperty({
    description: 'Số lượng sản phẩm muốn đặt mua (tối thiểu là 1)',
    example: 1,
    minimum: 1,
  })
  @IsNotEmpty({ message: 'Số lượng không được để trống' })
  @Type(() => Number)
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng đặt mua tối thiểu là 1' })
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Thông tin địa chỉ giao hàng của khách hàng',
    type: ShippingAddressDto,
  })
  @IsNotEmptyObject({}, { message: 'Thông tin địa chỉ giao hàng không được để trống' })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto;

  @ApiPropertyOptional({
    description:
      'Danh sách cartItemId được chọn từ giỏ hàng để đặt mua (nếu đặt mua từ giỏ hàng)',
    example: ['c4e4bf7e-07a8-48b2-b13c-0e2bbd8e0556'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'cartItemIds phải là một mảng' })
  @IsUUID('4', { each: true, message: 'Mỗi cartItemId phải là UUID v4 hợp lệ' })
  cartItemIds?: string[];

  @ApiPropertyOptional({
    description:
      'Danh sách mặt hàng đặt mua trực tiếp (Buy Now - không qua giỏ hàng)',
    type: [CreateOrderItemDto],
  })
  @IsOptional()
  @IsArray({ message: 'items phải là một mảng' })
  @ArrayMinSize(1, { message: 'Danh sách sản phẩm mua ngay phải có ít nhất 1 sản phẩm' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];

  @ApiProperty({
    description: 'Phương thức thanh toán',
    enum: PaymentMethod,
    default: PaymentMethod.COD,
    example: PaymentMethod.COD,
  })
  @IsNotEmpty({ message: 'Phương thức thanh toán không được để trống' })
  @IsEnum(PaymentMethod, {
    message: `Phương thức thanh toán phải là một trong các giá trị: ${Object.values(PaymentMethod).join(', ')}`,
  })
  paymentMethod!: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Ghi chú cho đơn hàng',
    example: 'Đóng gói cẩn thận giúp tôi',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú đơn hàng phải là chuỗi' })
  @MaxLength(500, { message: 'Ghi chú đơn hàng không được vượt quá 500 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  note?: string;
}
