import { UserStatus } from '../../constans/user-enum.constans';

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly fullName: string | null,
    public readonly phone: string | null,
    public readonly status: UserStatus,
    public readonly emailVerified: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}

  get isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE && !this.isDeleted;
  }
}
