import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { MailService } from '@/share/mail/mail.service';

/**
 * Prefix key lưu OTP trong Redis
 * Format: otp:forgot:<email>
 */
const OTP_KEY_PREFIX = 'otp:forgot';

@Injectable()
export class ForgotUseCase {
  private readonly logger = new Logger(ForgotUseCase.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async execute(email: string) {
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      return {
        message:
          'Nếu email tồn tại trong hệ thống, mã OTP đã được gửi đến hộp thư của bạn.',
      };
    }

    const redisKey = `${OTP_KEY_PREFIX}:${email}`;
    const remaining = await this.redis.ttl(redisKey);
    const ttlSeconds = this.configService.get<number>('OTP_TTL_SECONDS', 300);

    if (remaining > ttlSeconds - 60) {
      throw new BadRequestException(
        `Vui lòng chờ ${remaining - (ttlSeconds - 60)} giây trước khi yêu cầu OTP mới.`,
      );
    }

    const otp = this.mailService.generateOtp(6);

    await this.redis.setex(redisKey, ttlSeconds, otp);
    this.logger.log(
      `OTP [${otp}] stored in Redis for ${email}, TTL=${ttlSeconds}s`,
    );

    await this.mailService.sendForgotPassword(email, otp, {
      fullName: user.email,
      expiresInMinutes: Math.floor(ttlSeconds / 60),
    });

    this.logger.log(`Forgot-password email enqueued for ${email}`);
    return {
      message: 'Send OTP',
      email,
    };
  }
}
