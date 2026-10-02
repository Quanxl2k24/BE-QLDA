import { Injectable } from '@nestjs/common';
import { RbacRepository } from '../../domain/repositories/rbac.repository';

@Injectable()
export class DeleteRoleUseCase {
  constructor(private readonly rbacRepository: RbacRepository) {}

  async execute(id: string): Promise<boolean> {
    return await this.rbacRepository.deleteRole(id);
  }
}
