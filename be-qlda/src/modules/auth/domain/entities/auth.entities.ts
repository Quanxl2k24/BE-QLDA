import { UserStatus } from '@/modules/users/constans/user-enum.constans';

export class AuthEntity {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly status: UserStatus,
    public readonly emailVerified: boolean,
    public readonly deletedAt: Date | null,
  ) {}

  get isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  get canLogin(): boolean {
    return this.status === UserStatus.ACTIVE && !this.isDeleted;
  }
}
