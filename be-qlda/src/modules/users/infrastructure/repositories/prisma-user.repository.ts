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
}
