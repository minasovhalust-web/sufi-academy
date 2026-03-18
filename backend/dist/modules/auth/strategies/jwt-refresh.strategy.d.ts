import { Strategy } from 'passport-jwt';
import { Request } from 'express';
export interface JwtRefreshPayload {
    sub: string;
    email: string;
    role: string;
    refreshToken: string;
}
declare const JwtRefreshStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtRefreshStrategy extends JwtRefreshStrategy_base {
    constructor();
    validate(req: Request, payload: Omit<JwtRefreshPayload, 'refreshToken'>): Promise<JwtRefreshPayload>;
}
export {};
