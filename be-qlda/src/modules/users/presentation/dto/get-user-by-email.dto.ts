import { Transform } from 'class-transformer';
import { IsEmail, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetUserByEmailDto {
  @ApiProperty({
    description: 'Email của người dùng cần tìm kiếm',
    example: 'user@example.com',
    maxLength: 255,
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(255)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;
}
