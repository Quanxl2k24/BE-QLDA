import { Injectable } from '@nestjs/common';
import { RbacRepository } from '../../domain/repositories/rbac.repository';
import { RoleEntity } from '../../domain/entities/role.entity';

@Injectable()
export class GetRolesUseCase {
  constructor(private readonly rbacRepository: RbacRepository) {}

  async execute(): Promise<RoleEntity[]> {
    return await this.rbacRepository.getRoles();
  }
}

