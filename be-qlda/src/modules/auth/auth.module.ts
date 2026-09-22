import { Module } from '@nestjs/common';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { AuthRepository } from './domain/repositories/auth.repository';
import { PrismaAuthRepository } from './infrastructure/repositories/prisma-auth.repository';
import { AuthController } from './presentation/controllers/auth.controllers';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    {
      provide: AuthRepository,
      useClass: PrismaAuthRepository,
    },
  ],
  exports: [],
})
export class AuthModule {}
