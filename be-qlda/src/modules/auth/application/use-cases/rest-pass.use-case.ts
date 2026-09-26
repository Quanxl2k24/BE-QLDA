import { InjectRedis } from '@nestjs-modules/ioredis';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'argon2';
import { Redis } from 'ioredis';
import { AuthRepository } from '../../domain/repositories/auth.repository';

@Injectable()
export class RestPasswordUseCase {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authRepository: AuthRepository,
  ) {}

  async execute(token: string, passwordNew: string) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    // 1. Verify token JWT
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_REST_SECRET'),
      });
    } catch (error: any) {
      if (error?.name === 'TokenExpiredError') {
        throw new BadRequestException(
          'Token has expired. Please request a new OTP.',
        );
      }
      throw new BadRequestException('Invalid token.');
    }

    const email = payload?.sub;
    if (!email) {
      throw new BadRequestException('Invalid token payload.');
    }

    // 2. So sánh token với token trong Redis
    const keyRest = 'token:rest-password';
    const redisKey = `${keyRest}:${email}`;
    const tokenInRedis = await this.redis.get(redisKey);

    if (!tokenInRedis) {
      throw new BadRequestException(
        'Reset password session has expired or not found. Please request a new OTP.',
      );
    }

    if (tokenInRedis !== token) {
      throw new BadRequestException('Invalid or reused reset token.');
    }

    // 3. Kiểm tra user trong DB
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // 4. Hash mật khẩu mới bằng Argon2
    const passwordHash = await hash(passwordNew);

    // 5. Cập nhật mật khẩu trong DB (đồng thời huỷ các refresh token cũ)
    await this.authRepository.updatePassword(user.id, passwordHash);

    // 6. Xoá token trong Redis sau khi đổi pass thành công để tránh tái sử dụng
    await this.redis.del(redisKey);

    return {
      message: 'The password has been updated successfully.',
    };
  }
}
