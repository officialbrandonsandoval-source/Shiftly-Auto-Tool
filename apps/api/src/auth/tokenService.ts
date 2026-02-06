import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { User, Dealership, RefreshToken } from '@prisma/client'

export interface JWTPayload {
  userId: string
  dealershipId: string
  email: string
  role: string
}

export interface AuthResponse {
  user: UserDTO
  accessToken: string
  refreshToken: string
}

export interface UserDTO {
  id: string
  email: string
  name: string
  dealershipId: string
  role: string
  facebookId?: string
  facebookPageName?: string
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d'
const REFRESH_TOKEN_EXPIRY = '30d'

/**
 * Hash a password with simple SHA256 (for development only)
 * NOTE: In production, use bcrypt: await bcrypt.hash(password, 10)
 */
export async function hashPassword(password: string): Promise<string> {
  // Simple hash for development - DO NOT USE IN PRODUCTION
  return crypto.createHash('sha256').update(password).digest('hex')
}

/**
 * Compare password with hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex')
  return passwordHash === hash
}

/**
 * Create JWT access token
 */
export function createAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  } as any)
}

/**
 * Create JWT refresh token
 */
export function createRefreshToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  } as any)
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

/**
 * Convert User to DTO (safe to send to client)
 */
export function userToDTO(user: User): UserDTO {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    dealershipId: user.dealershipId,
    role: user.role,
    facebookId: user.facebookId || undefined,
    facebookPageName: user.facebookPageName || undefined,
  }
}

/**
 * Create auth response with tokens
 */
export function createAuthResponse(user: User): AuthResponse {
  const payload: JWTPayload = {
    userId: user.id,
    dealershipId: user.dealershipId,
    email: user.email,
    role: user.role,
  }

  return {
    user: userToDTO(user),
    accessToken: createAccessToken(payload),
    refreshToken: createRefreshToken(user.id),
  }
}
