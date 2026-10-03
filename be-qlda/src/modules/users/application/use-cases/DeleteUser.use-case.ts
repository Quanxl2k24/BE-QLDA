import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class DeleteUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(params: { currentUserId: string; targetId: string }) {
    const { currentUserId, targetId } = params;

    // Ngăn chặn admin tự xóa tài khoản của chính mình
    if (currentUserId === targetId) {
      throw new BadRequestException('Bạn không thể tự xóa tài khoản của chính mình');
    }

    const existingUser = await this.userRepository.findById(targetId);
    if (!existingUser || existingUser.isDeleted) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    await this.userRepository.delete(targetId);

    return {
      id: targetId,
    };
  }
}
