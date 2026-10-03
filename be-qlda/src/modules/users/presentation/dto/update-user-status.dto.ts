import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '../../constans/user-enum.constans';

export class UpdateUserStatusDto {
  @ApiProperty({
    description: 'Trạng thái mới của người dùng',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsEnum(UserStatus, {
    message: `Trạng thái không hợp lệ. Phải là một trong các giá trị: ${Object.values(
      UserStatus,
    ).join(', ')}`,
  })
  status!: UserStatus;
}
