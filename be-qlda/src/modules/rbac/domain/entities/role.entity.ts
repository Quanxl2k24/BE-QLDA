import { PermissonEntity } from './permission.entity';

export class RoleEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly permissions?: PermissonEntity[],
  ) {}
}

