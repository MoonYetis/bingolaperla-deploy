import { UserResponse } from '@/schemas/authSchemas';
export interface TokenPayload {
    userId: string;
    email: string;
    username: string;
    role: string;
    type: string;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}
export declare class AuthService {
    static generateAccessToken(user: UserResponse): string;
    static generateRefreshToken(user: UserResponse): string;
    static generateTokens(user: UserResponse): Promise<AuthTokens>;
    static verifyAccessToken(token: string): TokenPayload;
    static verifyRefreshToken(token: string): TokenPayload;
    static refreshAccessToken(refreshToken: string): Promise<AuthTokens>;
    static invalidateTokens(userId: string): Promise<void>;
    static isTokenBlacklisted(token: string): Promise<boolean>;
    static blacklistToken(token: string, expiresIn?: number): Promise<void>;
    static isSessionValid(userId: string): Promise<boolean>;
    static updateSessionActivity(userId: string): Promise<void>;
    static cleanupExpiredSessions(): Promise<void>;
}
export default AuthService;
//# sourceMappingURL=authService.d.ts.map