import { PermissonEntity } from '../entities/permission.entity';
import { RoleEntity } from '../entities/role.entity';

export abstract class RbacRepository {
  abstract getPermisson(): Promise<PermissonEntity[] | null>;
  abstract createRole(data: {
    name: string;
    permissonId: string[];
    description?: string;
  }): Promise<RoleEntity>;
  abstract getRoles(): Promise<RoleEntity[]>;
  abstract getRolesByUserId(userId: string): Promise<RoleEntity[]>;
  abstract updateRole(
    id: string,
    data: {
      name?: string;
      permissonId?: string[];
      description?: string;
    },
  ): Promise<RoleEntity>;
  abstract deleteRole(id: string): Promise<boolean>;
  abstract assignRoleToUser(
    userId: string,
    roleIds: string[],
    replace?: boolean,
  ): Promise<RoleEntity[]>;
}

