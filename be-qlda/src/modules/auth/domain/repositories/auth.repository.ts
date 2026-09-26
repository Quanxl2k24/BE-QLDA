import { AuthEntity } from '../entities/auth.entities';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';

export abstract class AuthRepository {
  abstract findByEmail(email: string): Promise<AuthEntity | null>;

  abstract findByTokenHash(
    tokenHash: string,
  ): Promise<RefreshTokenEntity | null>;

  abstract create(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    deviceName?: string | null;
    deviceType?: string | null;
    userAgent?: string | null;
    ipAddress?: string | null;
    revokedAt?: Date | null;
  }): Promise<RefreshTokenEntity | null>;

  abstract update(data: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    deviceName?: string | null;
    deviceType?: string | null;
    userAgent?: string | null;
    ipAddress?: string | null;
    revokedAt?: Date | null;
  }): Promise<RefreshTokenEntity | null>;

  abstract updatePassword(
    userId: string,
    passwordHash: string,
  ): Promise<void>;
}
