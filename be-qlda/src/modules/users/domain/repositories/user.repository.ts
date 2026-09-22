import { UserStatus } from '../../constans/user-enum.constans';
import { User } from '../entities/users-entities';

export abstract class UserRepository {
  //------create an abstract method to find a user by email-----
  abstract findByEmail(email: string): Promise<User | null>;
  abstract create(user: {
    email: string;
    passwordHash: string;
    fullName?: string | null;
    phone?: string | null;
    status?: UserStatus;
    emailVerified?: boolean;
  }): Promise<User>;
}
