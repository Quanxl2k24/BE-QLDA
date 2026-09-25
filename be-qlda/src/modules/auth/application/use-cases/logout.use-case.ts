import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { AuthRepository } from '../../domain/repositories/auth.repository';
@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly configService: ConfigService,
    private readonly authRepository: AuthRepository,
  ) {}
  hashToken(token: string): string {
    const hashHMAC = crypto
      .createHmac(
        'sha256',
        this.configService.get<string>('JWT_REFRESH_SECRET') || '',
      )
      .update(token)
      .digest('hex');
    return hashHMAC;
  }
  async execute(refreshToken: string) {
    if (!refreshToken) throw new NotFoundException('RefreshToken not found');

    const hashed = this.hashToken(refreshToken);
    const isRefreshTokens = await this.authRepository.findByTokenHash(hashed);
    if (!isRefreshTokens || !isRefreshTokens.isUsable) {
      throw new BadRequestException(
        'The refresh token does not exist, has expired or has been revoked.',
      );
    }
    const update = await this.authRepository.update({
      id: isRefreshTokens.id,
      userId: isRefreshTokens.userId,
      tokenHash: isRefreshTokens.tokenHash,
      expiresAt: isRefreshTokens.expiresAt,
      deviceName: isRefreshTokens.deviceName,
      deviceType: isRefreshTokens.deviceType,
      userAgent: isRefreshTokens.userAgent,
      ipAddress: isRefreshTokens.ipAddress,
      revokedAt: new Date(),
    });

    return {
      message: 'Logout successfully',
    };
  }
}
