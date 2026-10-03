import { UserStatus } from '../../constans/user-enum.constans';
import { User } from '../entities/users-entities';

export interface CursorPaginatedUsers {
  users: User[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

export abstract class UserRepository {
  abstract findByEmail(email: string): Promise<User | null>;
  abstract create(user: {
    email: string;
    passwordHash: string;
    fullName?: string | null;
    phone?: string | null;
    status?: UserStatus;
    emailVerified?: boolean;
  }): Promise<User>;

  abstract findById(id: string): Promise<User | null>;
  abstract update(
    id: string,
    data: {
      fullName?: string | null;
      phone?: string | null;
    },
  ): Promise<User>;
  abstract findAllWithCursor(params: {
    cursor?: string;
    limit: number;
  }): Promise<CursorPaginatedUsers>;
}
