import { PayloadToken } from '@/common/types/types';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { AuthRepository } from '../../domain/repositories/auth.repository';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  //generate token
  async generateAccessToken(
    userId: string,
    email: string,
    status: string,
  ): Promise<string> {
    const payload = {
      sub: userId,
      email,
      status,
    };
    const expiresIn = this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      '15m',
    ) as JwtSignOptions['expiresIn'];

    const jwtString = await this.jwtService.signAsync(payload, {
      expiresIn,
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
    });
    return jwtString;
  }

  async generateRefreshToken(
    userId: string,
    email: string,
    status: string,
    expiresAt: Date,
  ): Promise<string> {
    const expInSeconds = Math.floor(expiresAt.getTime() / 1000);
    const payload = {
      sub: userId,
      email,
      status,
      exp: expInSeconds,
    };

    const jwtString = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
    return jwtString;
  }
  //hashToken
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

  async execute(refreshToken: string, user: PayloadToken) {
    if (!refreshToken) throw new NotFoundException('RefreshToken not found');

    const hashed = this.hashToken(refreshToken);
    const isRefreshTokens = await this.authRepository.findByTokenHash(hashed);
    if (!isRefreshTokens || !isRefreshTokens.isUsable) {
      throw new BadRequestException(
        'The refresh token does not exist, has expired or has been revoked.',
      );
    }

    const accessTokenNew = await this.generateAccessToken(
      user.sub,
      user.email,
      user.status,
    );

    const refreshTokenNew = await this.generateRefreshToken(
      user.sub,
      user.email,
      user.status,
      isRefreshTokens.expiresAt,
    );

    const newHash = this.hashToken(refreshTokenNew);
    await this.authRepository.update({
      id: isRefreshTokens.id,
      userId: isRefreshTokens.userId,
      tokenHash: newHash,
      expiresAt: isRefreshTokens.expiresAt,
      deviceName: isRefreshTokens.deviceName,
      deviceType: isRefreshTokens.deviceType,
      userAgent: isRefreshTokens.userAgent,
      ipAddress: isRefreshTokens.ipAddress,
      revokedAt: isRefreshTokens.revokedAt,
    });

    return {
      data: {
        accessTokenNew,
        refreshTokenNew,
        expiresAt: isRefreshTokens.expiresAt,
      },
    };
  }
}
