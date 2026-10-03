import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user.repository';
import { GetUsersCursorDto } from '../../presentation/dto/get-users-cursor.dto';

@Injectable()
export class GetUsersCursorUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(dto: GetUsersCursorDto) {
    const limit = dto.limit ?? 10;
    const result = await this.userRepository.findAllWithCursor({
      cursor: dto.cursor,
      limit,
    });

    // Xóa passwordHash khỏi từng user
    const safeUsers = result.users.map((user) => {
      const { passwordHash, ...data } = user;
      return data;
    });

    return {
      items: safeUsers,
      pagination: {
        nextCursor: result.nextCursor,
        hasNextPage: result.hasNextPage,
        limit,
      },
    };
  }
}
