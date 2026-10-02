export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
}

export function toUserStatus(value: string): UserStatus {
  if (Object.values(UserStatus).includes(value as UserStatus)) {
    return value as UserStatus;
  }

  throw new Error(`Invalid user status in database: ${value}`);
}

export enum TokenType {
  EMAIL_VERIFY = 'EMAIL_VERIFY',
  PASSWORD_RESET = 'PASSWORD_RESET',
  MAGIC_LINK = 'MAGIC_LINK',
}
