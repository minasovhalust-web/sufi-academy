export declare class RefreshTokenEntity {
    id: string;
    tokenHash: string;
    userId: string;
    userAgent?: string;
    ipAddress?: string;
    expiresAt: Date;
    revokedAt?: Date;
    createdAt: Date;
    constructor(partial: Partial<RefreshTokenEntity>);
    get isValid(): boolean;
}
