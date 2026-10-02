import { BadRequestException, Injectable } from '@nestjs/common';
import { RbacRepository } from '../../domain/repositories/rbac.repository';
import { RoleEntity } from '../../domain/entities/role.entity';

@Injectable()
export class AssignRoleUseCase {
  constructor(private readonly rbacRepository: RbacRepository) {}

  async execute(
    userId: string,
    roleIds: string[],
    replace = false,
  ): Promise<RoleEntity[]> {
    if (!roleIds || roleIds.length === 0) {
      throw new BadRequestException(
        'Vui lòng cung cấp ít nhất một vai trò hợp lệ',
      );
    }
    return await this.rbacRepository.assignRoleToUser(userId, roleIds, replace);
  }
}
