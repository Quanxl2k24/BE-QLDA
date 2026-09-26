import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNumber,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AuthLoginDTO {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(255)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @MaxLength(72, { message: 'Mật khẩu tối đa 72 ký tự (bcrypt limit)' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Mật khẩu phải chứa ít nhất 1 chữ cái và 1 chữ số',
  })
  password!: string;
}

export class AuthForgotDTO {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(255)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;
}

export class AuthOTPForgotDTO {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(255)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @IsNumber({}, { message: 'otp không hợp lệ' })
  otp!: Number;
}

export class AuthRestPasswordDTO {
  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @MaxLength(72, { message: 'Mật khẩu tối đa 72 ký tự (bcrypt limit)' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Mật khẩu phải chứa ít nhất 1 chữ cái và 1 chữ số',
  })
  password!: string;
}

export class AuthResendOtpDTO {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(255)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;
}
