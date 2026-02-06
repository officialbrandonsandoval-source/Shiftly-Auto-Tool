import jwt from 'jsonwebtoken';
import crypto from 'crypto';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
const REFRESH_TOKEN_EXPIRY = '30d';
/**
 * Hash a password with simple SHA256 (for development only)
 * NOTE: In production, use bcrypt: await bcrypt.hash(password, 10)
 */
export async function hashPassword(password) {
    // Simple hash for development - DO NOT USE IN PRODUCTION
    return crypto.createHash('sha256').update(password).digest('hex');
}
/**
 * Compare password with hash
 */
export async function verifyPassword(password, hash) {
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    return passwordHash === hash;
}
/**
 * Create JWT access token
 */
export function createAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRY,
    });
}
/**
 * Create JWT refresh token
 */
export function createRefreshToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRY,
    });
}
/**
 * Verify and decode JWT token
 */
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
}
/**
 * Convert User to DTO (safe to send to client)
 */
export function userToDTO(user) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        dealershipId: user.dealershipId,
        role: user.role,
        facebookId: user.facebookId || undefined,
        facebookPageName: user.facebookPageName || undefined,
    };
}
/**
 * Create auth response with tokens
 */
export function createAuthResponse(user) {
    const payload = {
        userId: user.id,
        dealershipId: user.dealershipId,
        email: user.email,
        role: user.role,
    };
    return {
        user: userToDTO(user),
        accessToken: createAccessToken(payload),
        refreshToken: createRefreshToken(user.id),
    };
}
//# sourceMappingURL=tokenService.js.map