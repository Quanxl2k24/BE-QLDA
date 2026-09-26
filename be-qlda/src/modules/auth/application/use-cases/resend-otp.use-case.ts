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
export class ResendOtpUseCase {
  private readonly logger = new Logger(ResendOtpUseCase.name);

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

    // Chống spam: Người dùng phải đợi tối thiểu 60s kể từ lần gửi trước đó
    if (remaining > ttlSeconds - 60) {
      const waitSeconds = remaining - (ttlSeconds - 60);
      throw new BadRequestException(
        `Vui lòng chờ ${waitSeconds} giây trước khi yêu cầu gửi lại OTP mới.`,
      );
    }

    // Sinh mã OTP 6 số mới
    const otp = this.mailService.generateOtp(6);

    // Lưu mã OTP mới vào Redis với TTL mới
    await this.redis.setex(redisKey, ttlSeconds, otp);
    this.logger.log(
      `Resend OTP [${otp}] stored in Redis for ${email}, TTL=${ttlSeconds}s`,
    );

    // Gửi email chứa OTP
    await this.mailService.sendForgotPassword(email, otp, {
      fullName: user.email,
      expiresInMinutes: Math.floor(ttlSeconds / 60),
    });

    this.logger.log(`Resend OTP email enqueued for ${email}`);

    return {
      message: 'Mã OTP mới đã được gửi đến email của bạn.',
      email,
    };
  }
}
