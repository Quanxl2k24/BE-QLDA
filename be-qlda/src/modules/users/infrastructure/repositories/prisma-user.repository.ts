import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.services';
import { toUserStatus } from '../../constans/user-enum.constans';
import { User } from '../../domain/entities/users-entities';
import { UserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    return new User(
      user.id,
      user.email,
      user.passwordHash,
      user.fullName,
      user.phone,
      toUserStatus(user.status),
      user.emailVerified,
      user.createdAt,
      user.updatedAt,
      user.deletedAt,
    );
  }

  async create(data: {
    email: string;
    passwordHash: string;
    fullName: string;
  }): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        fullName: data.fullName,
      },
    });

    return new User(
      user.id,
      user.email,
      user.passwordHash,
      user.fullName,
      user.phone,
      toUserStatus(user.status),
      user.emailVerified,
      user.createdAt,
      user.updatedAt,
      user.deletedAt,
    );
  }

  async get(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    return new User(
      user.id,
      user.email,
      user.passwordHash,
      user.fullName,
      user.phone,
      toUserStatus(user.status),
      user.emailVerified,
      user.createdAt,
      user.updatedAt,
      user.deletedAt,
    );
  }

  async findById(id: string): Promise<User | null> {
    const data = await this.prisma.user.findUnique({
      where: {
        id: id,
      },
    });
    if (!data) return null;
    return new User(
      data.id,
      data.email,
      data.passwordHash,
      data.fullName,
      data.phone,
      toUserStatus(data.status),
      data.emailVerified,
      data.createdAt,
      data.updatedAt,
      data.deletedAt,
    );
  }

  async update(
    id: string,
    data: {
      fullName?: string | null;
      phone?: string | null;
    },
  ): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
    });

    return new User(
      updated.id,
      updated.email,
      updated.passwordHash,
      updated.fullName,
      updated.phone,
      toUserStatus(updated.status),
      updated.emailVerified,
      updated.createdAt,
      updated.updatedAt,
      updated.deletedAt,
    );
  }
  async findAllWithCursor(params: {
    cursor?: string;
    limit: number;
  }): Promise<{
    users: User[];
    nextCursor: string | null;
    hasNextPage: boolean;
  }> {
    const { cursor, limit } = params;

    // Lấy dư 1 phần tử (limit + 1) để kiểm tra có trang sau không
    const records = await this.prisma.user.findMany({
      take: limit + 1,
      skip: cursor ? 1 : 0, // Bỏ qua chính bản ghi cursor
      cursor: cursor ? { id: cursor } : undefined,
      where: {
        deletedAt: null,
      },
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' }, // Đảm bảo sắp xếp tuyệt đối ổn định
      ],
    });

    const hasNextPage = records.length > limit;

    // Nếu có trang kế tiếp thì cắt phần tử thừa thứ (limit + 1)
    if (hasNextPage) {
      records.pop();
    }

    const nextCursor =
      hasNextPage && records.length > 0 ? records[records.length - 1].id : null;

    const users = records.map(
      (item) =>
        new User(
          item.id,
          item.email,
          item.passwordHash,
          item.fullName,
          item.phone,
          toUserStatus(item.status),
          item.emailVerified,
          item.createdAt,
          item.updatedAt,
          item.deletedAt,
        ),
    );

    return {
      users,
      nextCursor,
      hasNextPage,
    };
  }
}
