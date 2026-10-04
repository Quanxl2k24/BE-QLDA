import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateCategoriesDto {
  @ApiProperty({
    description: 'Tên danh mục',
    example: 'Bánh Trung Thu',
    maxLength: 150,
  })
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @IsString({ message: 'Tên danh mục phải là chuỗi' })
  @MaxLength(150, { message: 'Tên danh mục không được vượt quá 150 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @ApiPropertyOptional({
    description: 'Đường dẫn thân thiện (slug)',
    example: 'banh-trung-thu',
    maxLength: 180,
  })
  @IsOptional()
  @IsString({ message: 'Slug phải là chuỗi' })
  @MaxLength(180, { message: 'Slug không được vượt quá 180 ký tự' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  slug!: string;

  @ApiPropertyOptional({
    description: 'Mô tả danh mục',
    example: 'Các loại bánh trung thu cao cấp',
  })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái danh mục (ACTIVE, INACTIVE, ...)',
    example: 'ACTIVE',
    default: 'ACTIVE',
    maxLength: 30,
  })
  @IsOptional()
  @IsString({ message: 'Trạng thái phải là chuỗi' })
  @MaxLength(30, { message: 'Trạng thái không được vượt quá 30 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  status!: string;

  @ApiPropertyOptional({
    description: 'ID danh mục cha (nếu là danh mục con)',
    example: 'b1e8e8e2-624d-4df4-8d4e-d007c082531a',
  })
  @IsOptional()
  @IsUUID('4', { message: 'parentId phải là định dạng UUID v4' })
  parentId?: string;
}

export { CreateCategoriesDto as CreateCategoryDto };
