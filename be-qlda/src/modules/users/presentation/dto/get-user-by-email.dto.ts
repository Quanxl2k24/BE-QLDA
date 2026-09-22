import { Transform } from 'class-transformer';
import { IsEmail, MaxLength } from 'class-validator';

export class getUserByEmmail {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(255)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;
}
