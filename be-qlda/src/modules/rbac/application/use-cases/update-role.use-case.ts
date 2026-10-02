import { Injectable } from '@nestjs/common';
import { RbacRepository } from '../../domain/repositories/rbac.repository';
import { RoleEntity } from '../../domain/entities/role.entity';

@Injectable()
export class UpdateRoleUseCase {
  constructor(private readonly rbacRepository: RbacRepository) {}

  async execute(
    id: string,
    data: {
      name?: string;
      permissonId?: string[];
      description?: string;
    },
  ): Promise<RoleEntity> {
    return await this.rbacRepository.updateRole(id, data);
  }
}
