export class RefreshTokenEntity {
  id: string;
  tokenHash: string;
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
  constructor(partial: Partial<RefreshTokenEntity>) { Object.assign(this, partial); }
  get isValid(): boolean { return !this.revokedAt && this.expiresAt > new Date(); }
}
