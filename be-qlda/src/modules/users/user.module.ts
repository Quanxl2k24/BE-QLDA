import { Module } from '@nestjs/common';
import { CreateUseCase } from './application/use-cases/CreateUser.use-case';
import { UserRepository } from './domain/repositories/user.repository';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { UserController } from './presentation/controllers/user.controller';
import { GetUserByEmailUseCase } from './application/use-cases/GetUserByEmail.use-case';
import { GetMeUseCase } from './application/use-cases/GetMe.use-case';
import { UpdateUserUseCase } from './application/use-cases/UpdateUser.use-case';
import { GetUsersCursorUseCase } from './application/use-cases/GetUsers.use-case';
import { GetUserByIdUseCase } from './application/use-cases/GetUserById.use-case';

@Module({
  controllers: [UserController],
  providers: [
    CreateUseCase,
    GetUserByEmailUseCase,
    GetMeUseCase,
    UpdateUserUseCase,
    GetUsersCursorUseCase,
    GetUserByIdUseCase,
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
  ],
})
export class UserModule {}
