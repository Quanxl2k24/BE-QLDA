import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UpdateUserDto } from '../../presentation/dto/update-user.dto';

@Injectable()
export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string, dto: UpdateUserDto) {
    if (!userId) {
      throw new BadRequestException('User ID không hợp lệ');
    }

    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundException('User không tồn tại');
    }

    if (existingUser.isDeleted) {
      throw new BadRequestException('Tài khoản đã bị vô hiệu hóa');
    }

    const updatedUser = await this.userRepository.update(userId, {
      fullName: dto.fullName,
      phone: dto.phone,
    });

    const { passwordHash, ...safeUserData } = updatedUser;
    return safeUserData;
  }
}
