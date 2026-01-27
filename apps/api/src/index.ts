import express, { Request, Response } from 'express'
import cors from 'cors'
import { generateToken, authMiddleware, AuthRequest } from './auth.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'PONS Auto API', version: '0.1.0' })
})

// Auth routes
app.post('/auth/login', (req: Request, res: Response) => {
  const { email } = req.body
  if (!email) {
    return res.status(400).json({ error: 'Email required' })
  }

  // Generate token (in real app, validate credentials)
  const token = generateToken(email)
  res.json({ token, user: { email } })
})

// Protected route: get current user
app.get('/me', authMiddleware as any, (req: AuthRequest, res: Response) => {
  res.json({ user: { id: req.userId } })
})

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`)
  console.log(`✓ Health check: http://localhost:${PORT}/health`)
  console.log(`✓ Auth: POST http://localhost:${PORT}/auth/login`)
  console.log(`✓ Protected: GET http://localhost:${PORT}/me (requires token)`)
})
