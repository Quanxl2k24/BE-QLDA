import { Module } from '@nestjs/common';
import { RbacControler } from './presentation/controllers/rbac.controller';
import { GetPermissonUseCase } from './application/use-cases/get-permisson.use-case';
import { PrismaRbacRepository } from './infrastructure/repositories/prisma-rbac.repository';
import { RbacRepository } from './domain/repositories/rbac.repository';
import { CreateRoleUseCase } from './application/use-cases/create-role.use-case';
import { PermissionsGuard } from './infrastructure/guards/permissions.guard';
import { GetRolesUseCase } from './application/use-cases/get-roles.use-case';
import { GetUserRolesUseCase } from './application/use-cases/get-user-roles.use-case';
import { UpdateRoleUseCase } from './application/use-cases/update-role.use-case';
import { DeleteRoleUseCase } from './application/use-cases/delete-role.use-case';
import { AssignRoleUseCase } from './application/use-cases/assign-role.use-case';

@Module({
  imports: [],
  controllers: [RbacControler],
  providers: [
    GetPermissonUseCase,
    CreateRoleUseCase,
    PermissionsGuard,
    GetRolesUseCase,
    GetUserRolesUseCase,
    UpdateRoleUseCase,
    DeleteRoleUseCase,
    AssignRoleUseCase,
    {
      provide: RbacRepository,
      useClass: PrismaRbacRepository,
    },
  ],
  exports: [PermissionsGuard],
})
export class RabcModule {}
