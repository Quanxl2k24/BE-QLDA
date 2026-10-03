import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UserStatus } from '../../constans/user-enum.constans';

@Injectable()
export class UpdateUserStatusUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(params: {
    currentUserId: string;
    targetId: string;
    status: UserStatus;
  }) {
    const { currentUserId, targetId, status } = params;

    // Ngăn chặn admin tự khóa tài khoản của chính mình
    if (currentUserId === targetId && status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Bạn không thể tự khóa tài khoản của chính mình');
    }

    const existingUser = await this.userRepository.findById(targetId);
    if (!existingUser || existingUser.isDeleted) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const updatedUser = await this.userRepository.updateStatus(targetId, status);
    const { passwordHash, ...safeUserData } = updatedUser;

    return safeUserData;
  }
}
