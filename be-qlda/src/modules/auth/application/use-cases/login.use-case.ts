import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { verify } from 'argon2';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import type { Request } from 'express';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: { email: string; password: string }, req: Request) {
    const user = await this.authRepository.findByEmail(input.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.canLogin) {
      throw new NotFoundException('User cannot login');
    }
    const passwordTrue = await verify(user.passwordHash, input.password);
    if (!passwordTrue)
      throw new BadRequestException('Incorrect email or password.');

    const accessToken = await this.generateAccessToken(
      user.id,
      user.email,
      user.status,
    );

    const refreshToken = await this.generateRefreshToken(
      user.id,
      user.email,
      user.status,
    );

    const hash = this.hashToken(refreshToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const userAgent = req.headers['user-agent'] || null;

    let ipAddress = req.headers['x-forwarded-for']
      ? (req.headers['x-forwarded-for'] as string).split(',')[0]
      : req.ip || null;

    const deviceName = (req.headers['x-device-name'] as string) || null;
    const deviceType = (req.headers['x-device-type'] as string) || null;

    await this.authRepository.create({
      userId: user.id,
      tokenHash: hash,
      expiresAt: expiresAt,
      userAgent,
      ipAddress,
      deviceName,
      deviceType,
    });

    return {
      data: {
        accessToken,
        refreshToken,
      },
    };
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
  ): Promise<string> {
    const payload = {
      sub: userId,
      email,
      status,
    };
    const expiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '30d',
    ) as JwtSignOptions['expiresIn'];

    const jwtString = await this.jwtService.signAsync(payload, {
      expiresIn,
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
    return jwtString;
  }
}
