import { PayloadToken } from '@/common/types/types';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user.repository';
@Injectable()
export class GetMeUseCase {
  constructor(private readonly userRepository: UserRepository) {}
  async execute(payload: PayloadToken) {
    if (!payload.sub) throw new BadRequestException('Token không hợp lệ');
    const user = await this.userRepository.findById(payload.sub);
    if (!user) throw new NotFoundException('User không tồn tại');
    const { passwordHash, ...data } = user;
    return data;
  }
}
