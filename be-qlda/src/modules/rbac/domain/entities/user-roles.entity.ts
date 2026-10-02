export class UserRolesEntity {
  constructor(
    public readonly userId: string,
    public readonly roleId: string,
    public readonly createAt: Date,
  ) {}
}
