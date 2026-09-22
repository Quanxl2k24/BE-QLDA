import { Module } from '@nestjs/common';
import { CreateUseCase } from './application/use-cases/CreateUser.use-case';
import { UserRepository } from './domain/repositories/user.repository';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { UserController } from './presentation/controllers/user.controller';
import { getUserByEmailUseCase } from './application/use-cases/GetUserByEmail.use-case';

@Module({
  controllers: [UserController],
  providers: [
    CreateUseCase,
    getUserByEmailUseCase,
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
  ],
})
export class UserModule {}
