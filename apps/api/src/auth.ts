import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { validateApiKey } from './apiKeys.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production'

export interface AuthRequest extends Request {
  userId?: string
  apiKeyId?: string
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' })
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' })
  }

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string }
    req.userId = payload.userId
    next()
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function apiKeyMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string
  if (!apiKey) {
    return res.status(401).json({ error: 'Missing X-API-Key header' })
  }

  const apiKeyId = validateApiKey(apiKey)
  if (!apiKeyId) {
    return res.status(401).json({ error: 'Invalid or revoked API key' })
  }

  req.apiKeyId = apiKeyId
  next()
}
