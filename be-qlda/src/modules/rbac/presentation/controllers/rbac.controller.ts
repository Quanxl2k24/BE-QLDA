import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GetPermissonUseCase } from '../../application/use-cases/get-permisson.use-case';
import { CreateRoleUseCase } from '../../application/use-cases/create-role.use-case';
import { AccessTokenGuard } from '@/modules/auth/infrastructure/guards/access-token.guard';
import { PermissionsGuard } from '@/modules/rbac/infrastructure/guards/permissions.guard';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { PermissionEnum } from '@/common/enums/rbac.enum';
import { RbacDTO } from '../dto/rbac.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { AssignRoleDto } from '../dto/assign-role.dto';
import { GetRolesUseCase } from '../../application/use-cases/get-roles.use-case';
import { GetUserRolesUseCase } from '../../application/use-cases/get-user-roles.use-case';
import { UpdateRoleUseCase } from '../../application/use-cases/update-role.use-case';
import { DeleteRoleUseCase } from '../../application/use-cases/delete-role.use-case';
import { AssignRoleUseCase } from '../../application/use-cases/assign-role.use-case';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('RBAC')
@Controller({
  path: '/rbac',
  version: '1',
})
export class RbacControler {
  constructor(
    private readonly getPermissonUseCase: GetPermissonUseCase,
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly getRolesUseCase: GetRolesUseCase,
    private readonly getUserRolesUseCase: GetUserRolesUseCase,
    private readonly updateRoleUseCase: UpdateRoleUseCase,
    private readonly deleteRoleUseCase: DeleteRoleUseCase,
    private readonly assignRoleUseCase: AssignRoleUseCase,
  ) {}

  //roles
  @Post('role')
  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.ROLE_CREATE)
  async createRole(@Body() body: RbacDTO) {
    return await this.createRoleUseCase.execute(
      body.name,
      body.permissonId,
      body.description,
    );
  }

  @Get('roles')
  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.ROLE_READ)
  async getRoles() {
    return await this.getRolesUseCase.execute();
  }

  @Get(['users/:userId/roles', 'user/:userId/roles'])
  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.ROLE_READ)
  async getUserRoles(@Param('userId', ParseUUIDPipe) userId: string) {
    return await this.getUserRolesUseCase.execute(userId);
  }

  @Post(['users/:userId/roles', 'user/:userId/roles'])
  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.ROLE_UPDATE)
  async assignRole(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: AssignRoleDto,
  ) {
    const roleIds = body.roleIds ?? (body.roleId ? [body.roleId] : []);
    return await this.assignRoleUseCase.execute(
      userId,
      roleIds,
      body.replace ?? false,
    );
  }

  @Patch(['roles/:id', 'role/:id'])
  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.ROLE_UPDATE)
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateRoleDto,
  ) {
    return await this.updateRoleUseCase.execute(id, body);
  }

  @Delete(['roles/:id', 'role/:id'])
  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.ROLE_DELETE)
  async deleteRole(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteRoleUseCase.execute(id);
    return {
      message: 'Xóa vai trò thành công',
      id,
    };
  }

  //permisson
  @Get('/permisson')
  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.PERMISSION_READ)
  async getPermisson() {
    return await this.getPermissonUseCase.execute();
  }
}
