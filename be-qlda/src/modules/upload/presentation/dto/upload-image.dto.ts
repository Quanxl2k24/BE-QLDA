import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UploadImageDto {
  @ApiPropertyOptional({
    description: 'Thư mục trên Cloudinary để lưu trữ ảnh',
    example: 'mooncake/products',
    default: 'mooncake/products',
  })
  @IsOptional()
  @IsString({ message: 'Folder phải là chuỗi' })
  folder?: string;
}

export class DeleteImageDto {
  @ApiProperty({
    description: 'Public ID của ảnh trên Cloudinary cần xóa',
    example: 'mooncake/products/sample_xyz123',
  })
  @IsNotEmpty({ message: 'publicId không được để trống' })
  @IsString({ message: 'publicId phải là chuỗi' })
  publicId!: string;
}
