import 'dotenv/config'
import { Router, Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import {
  hashPassword,
  verifyPassword,
  createAuthResponse,
  createAccessToken,
  createRefreshToken,
  verifyToken,
  JWTPayload,
} from './tokenService.js'

// Debug environment variables
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
console.log('DATABASE_URL value (first 20 chars):', process.env.DATABASE_URL?.substring(0, 20))

const router: Router = Router()
let prisma: PrismaClient | null = null

function getPrisma() {
  if (!prisma) {
    try {
      console.log('Creating PrismaClient')
      prisma = new PrismaClient()
      console.log('PrismaClient created successfully')
    } catch (error) {
      console.error('Prisma initialization error:', error)
      throw error
    }
  }
  return prisma
}

// ==================== SIGNUP ====================

interface SignupRequest {
  dealershipName: string
  email: string
  password: string
  name: string
}

router.post('/signup/dealership', async (req: Request, res: Response) => {
  try {
    const { dealershipName, email, password, name } = req.body as SignupRequest

    // Validate input
    if (!dealershipName || !email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Check if dealership already exists
    const existingDealership = await getPrisma().dealership.findUnique({
      where: { email },
    })

    if (existingDealership) {
      return res.status(409).json({ error: 'Dealership already exists' })
    }

    // Create dealership and admin user
    const dealership = await getPrisma().dealership.create({
      data: {
        name: dealershipName,
        email: email,
        users: {
          create: {
            email: email,
            name: name,
            password: await hashPassword(password),
            role: 'admin',
          },
        },
      },
      include: {
        users: {
          take: 1,
        },
      },
    })

    const adminUser = dealership.users[0]
    const response = createAuthResponse(adminUser)

    res.status(201).json({
      message: 'Dealership created successfully',
      dealership: {
        id: dealership.id,
        name: dealership.name,
        email: dealership.email,
        apiKey: dealership.apiKey,
      },
      auth: response,
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ error: 'Failed to create dealership' })
  }
})

// ==================== LOGIN ====================

interface LoginRequest {
  email: string
  password: string
}

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginRequest

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    // Find user
    const user = await getPrisma().user.findFirst({
      where: { email: email },
      include: { dealership: true },
    })

    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'User account is inactive' })
    }

    const response = createAuthResponse(user)

    res.json({
      message: 'Login successful',
      auth: response,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// ==================== INVITE USER ====================

interface InviteRequest {
  email: string
  name: string
  role: string
}

// Middleware to verify API key
async function verifyApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' })
  }

  const dealership = await getPrisma().dealership.findUnique({
    where: { apiKey },
  })

  if (!dealership) {
    return res.status(401).json({ error: 'Invalid API key' })
  }

  ;(req as any).dealership = dealership
  next()
}

router.post('/invite-user', verifyApiKey, async (req: Request, res: Response) => {
  try {
    const { email, name, role } = req.body as InviteRequest
    const dealership = (req as any).dealership

    // Validate input
    if (!email || !name || !role) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Check if user already exists
    const existingUser = await getPrisma().user.findFirst({
      where: {
        dealershipId: dealership.id,
        email: email,
      },
    })

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists in this dealership' })
    }

    // Create user without password (they'll set it or use OAuth)
    const user = await getPrisma().user.create({
      data: {
        dealershipId: dealership.id,
        email: email,
        name: name,
        role: role,
      },
    })

    res.status(201).json({
      message: 'User invited successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Invite error:', error)
    res.status(500).json({ error: 'Failed to invite user' })
  }
})

// ==================== REFRESH TOKEN ====================

interface RefreshRequest {
  refreshToken: string
}

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body as RefreshRequest

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' })
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken)
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid refresh token' })
    }

    // Get user
    const user = await getPrisma().user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' })
    }

    const response = createAuthResponse(user)

    res.json({
      message: 'Token refreshed',
      auth: response,
    })
  } catch (error) {
    console.error('Refresh error:', error)
    res.status(500).json({ error: 'Token refresh failed' })
  }
})

// ==================== VERIFY TOKEN ====================

router.post('/verify', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)

    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Get fresh user data
    const user = await getPrisma().user.findUnique({
      where: { id: payload.userId },
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' })
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    res.status(401).json({ error: 'Token verification failed' })
  }
})

export default router
