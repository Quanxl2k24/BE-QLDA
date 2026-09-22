export class RefreshTokenEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tokenHash: string,
    public readonly deviceName: string | null,
    public readonly deviceType: string | null,
    public readonly userAgent: string | null,
    public readonly ipAddress: string | null,
    public readonly expiresAt: Date,
    public readonly revokedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  get isRevoked(): boolean {
    return this.revokedAt !== null;
  }

  get isExpired(): boolean {
    return this.expiresAt.getTime() <= Date.now();
  }

  get isUsable(): boolean {
    return !this.isRevoked && !this.isExpired;
  }
}
