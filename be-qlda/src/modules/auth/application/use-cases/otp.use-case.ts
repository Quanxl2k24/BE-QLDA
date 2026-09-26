import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
@Injectable()
export class OTPUseCase {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async generateRestToken(email: string): Promise<string> {
    const payload = {
      sub: email,
    };
    const expiresIn = this.configService.get<string>(
      'JWT_RESET_EXPIRES_IN',
      '5m',
    ) as JwtSignOptions['expiresIn'];

    const jwtString = await this.jwtService.signAsync(payload, {
      expiresIn,
      secret: this.configService.get<string>('JWT_REST_SECRET'),
    });
    return jwtString;
  }
  async execute(email: string, otp: Number) {
    const OTP_KEY_PREFIX = 'otp:forgot';
    const redisKey = `${OTP_KEY_PREFIX}:${email}`;
    const otpStore = await this.redis.get(redisKey);
    const tllSeconds = this.configService.get('TOKEN_TTL_SECONDS');
    if (!otpStore) {
      throw new BadRequestException('OTP expired or not found');
    }
    if (Number(otpStore) !== otp)
      throw new BadRequestException('Incorrect OTP');

    const keyRest = 'token:rest-password';
    const key = `${keyRest}:${email}`;
    const token = await this.generateRestToken(email);
    const urlFE = `${this.configService.get('URL_FE')}/rest-password?token=${token}`;

    await this.redis.setex(key, tllSeconds, token);

    await this.redis.del(redisKey);
    return {
      url: urlFE,
    };
  }
}
