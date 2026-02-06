import { User } from '@prisma/client';
export interface JWTPayload {
    userId: string;
    dealershipId: string;
    email: string;
    role: string;
}
export interface AuthResponse {
    user: UserDTO;
    accessToken: string;
    refreshToken: string;
}
export interface UserDTO {
    id: string;
    email: string;
    name: string;
    dealershipId: string;
    role: string;
    facebookId?: string;
    facebookPageName?: string;
}
/**
 * Hash a password with simple SHA256 (for development only)
 * NOTE: In production, use bcrypt: await bcrypt.hash(password, 10)
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Compare password with hash
 */
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
/**
 * Create JWT access token
 */
export declare function createAccessToken(payload: JWTPayload): string;
/**
 * Create JWT refresh token
 */
export declare function createRefreshToken(userId: string): string;
/**
 * Verify and decode JWT token
 */
export declare function verifyToken(token: string): JWTPayload | null;
/**
 * Convert User to DTO (safe to send to client)
 */
export declare function userToDTO(user: User): UserDTO;
/**
 * Create auth response with tokens
 */
export declare function createAuthResponse(user: User): AuthResponse;
//# sourceMappingURL=tokenService.d.ts.map