import { Injectable } from '@nestjs/common';
import { RbacRepository } from '../../domain/repositories/rbac.repository';
import { RoleEntity } from '../../domain/entities/role.entity';

@Injectable()
export class GetUserRolesUseCase {
  constructor(private readonly rbacRepository: RbacRepository) {}

  async execute(userId: string): Promise<RoleEntity[]> {
    return await this.rbacRepository.getRolesByUserId(userId);
  }
}
