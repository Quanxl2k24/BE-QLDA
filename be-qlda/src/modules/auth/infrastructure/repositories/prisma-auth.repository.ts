import { PrismaService } from '@/database/prisma/prisma.services';
import { toUserStatus } from '@/modules/users/constans/user-enum.constans';
import { Injectable } from '@nestjs/common';
import { AuthEntity } from '../../domain/entities/auth.entities';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { RefreshTokenEntity } from '../../domain/entities/refresh-token.entity';

@Injectable()
export class PrismaAuthRepository implements AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}
  async findByEmail(email: string): Promise<AuthEntity | null> {
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      return null;
    }

    return new AuthEntity(
      user.id,
      user.email,
      user.passwordHash,
      toUserStatus(user.status),
      user.emailVerified,
      user.deletedAt,
    );
  }

  async create(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    deviceName?: string | null;
    deviceType?: string | null;
    userAgent?: string | null;
    ipAddress?: string | null;
    revokedAt?: Date | null;
  }): Promise<RefreshTokenEntity | null> {
    const refreshToken = await this.prismaService.refreshToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        deviceName: data.deviceName,
        deviceType: data.deviceType,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        expiresAt: data.expiresAt,
        revokedAt: data.revokedAt,
      },
    });
    return new RefreshTokenEntity(
      refreshToken.id,
      refreshToken.userId,
      refreshToken.tokenHash,
      refreshToken.deviceName,
      refreshToken.deviceType,
      refreshToken.userAgent,
      refreshToken.ipAddress,
      refreshToken.expiresAt,
      refreshToken.revokedAt,
      refreshToken.createdAt,
      refreshToken.updatedAt,
    );
  }

  async update(data: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    deviceName?: string | null;
    deviceType?: string | null;
    userAgent?: string | null;
    ipAddress?: string | null;
    revokedAt?: Date | null;
  }): Promise<RefreshTokenEntity | null> {
    const update = await this.prismaService.refreshToken.update({
      where: {
        id: data.id,
      },
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        deviceName: data.deviceName,
        deviceType: data.deviceType,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        expiresAt: data.expiresAt,
        revokedAt: data.revokedAt,
      },
    });
    return new RefreshTokenEntity(
      update.id,
      update.userId,
      update.tokenHash,
      update.deviceName,
      update.deviceType,
      update.userAgent,
      update.ipAddress,
      update.expiresAt,
      update.revokedAt,
      update.createdAt,
      update.updatedAt,
    );
  }

  async findByTokenHash(tokenhash: string): Promise<RefreshTokenEntity | null> {
    const find = await this.prismaService.refreshToken.findUnique({
      where: {
        tokenHash: tokenhash,
      },
    });
    if (!find) return null;
    return new RefreshTokenEntity(
      find.id,
      find.userId,
      find.tokenHash,
      find.deviceName,
      find.deviceType,
      find.userAgent,
      find.ipAddress,
      find.expiresAt,
      find.revokedAt,
      find.createdAt,
      find.updatedAt,
    );
  }
}
