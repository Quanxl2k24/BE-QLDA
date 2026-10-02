import { Injectable } from '@nestjs/common';
import { RbacRepository } from '../../domain/repositories/rbac.repository';

@Injectable()
export class CreateRoleUseCase {
  constructor(private readonly rbacRepository: RbacRepository) {}

  async execute(name: string, permissonId: string[], description?: string) {
    return await this.rbacRepository.createRole({
      name,
      permissonId,
      description,
    });
  }
}
