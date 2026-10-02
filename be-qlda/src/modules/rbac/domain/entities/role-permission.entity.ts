export class RolePermissonEntity {
  constructor(
    public readonly roleId: string,
    public readonly permissionId: string,
    public readonly createdAt: Date,
  ) {}
}
