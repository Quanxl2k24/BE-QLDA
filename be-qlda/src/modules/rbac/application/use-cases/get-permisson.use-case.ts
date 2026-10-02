import { Injectable, NotFoundException } from '@nestjs/common';
import { RbacRepository } from '../../domain/repositories/rbac.repository';

@Injectable()
export class GetPermissonUseCase {
  constructor(private readonly rbacRepository: RbacRepository) {}
  async execute() {
    const permisson = await this.rbacRepository.getPermisson();
    if (!permisson) throw new NotFoundException('Permission does not exist.');
    return permisson;
  }
}
