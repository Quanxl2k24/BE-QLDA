import { Module } from '@nestjs/common';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { AuthRepository } from './domain/repositories/auth.repository';
import { PrismaAuthRepository } from './infrastructure/repositories/prisma-auth.repository';
import { AuthController } from './presentation/controllers/auth.controllers';
import { JwtModule } from '@nestjs/jwt';
import { RefreshTokenUseCase } from './application/use-cases/refresh.use-case';
import { RefreshTokenStrategy } from './infrastructure/strategies/refresh-token.strategy';
import { AccessTokenStrategy } from './infrastructure/strategies/access-token.strategies';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { ForgotUseCase } from './application/use-cases/forgot.use-case';
import { OTPUseCase } from './application/use-cases/otp.use-case';
import { RestPasswordUseCase } from './application/use-cases/rest-pass.use-case';
import { ResendOtpUseCase } from './application/use-cases/resend-otp.use-case';

@Module({
  imports: [JwtModule],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RefreshTokenUseCase,
    RefreshTokenStrategy,
    AccessTokenStrategy,
    LogoutUseCase,
    ForgotUseCase,
    OTPUseCase,
    RestPasswordUseCase,
    ResendOtpUseCase,
    {
      provide: AuthRepository,
      useClass: PrismaAuthRepository,
    },
  ],
  exports: [],
})
export class AuthModule {}
