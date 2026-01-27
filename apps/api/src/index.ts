import express, { Request, Response } from 'express'
import cors from 'cors'
import { generateToken, authMiddleware, apiKeyMiddleware, AuthRequest } from './auth.js'
import { createApiKey, listApiKeys, revokeApiKey, getApiKey } from './apiKeys.js'
import {
  createProviderConnection,
  getProviderConnection,
  listProviderConnections,
  revokeProviderConnection,
  updateSyncStatus,
  ProviderCredentials,
} from './providers.js'
import { listVehicles, getVehicle, countVehicles } from './vehicles.js'
import { syncProviderConnection, getAdapter } from './sync.js'
import { generateListingPackage } from './listing.js'
import { correlationIdMiddleware, getCorrelationId, RequestWithCorrelation } from './correlation.js'
import { getSyncLogsByConnection, getSyncLogsByDealer, getLastSyncStatus } from './syncLogs.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())
app.use(correlationIdMiddleware as any) // Add correlation ID to all requests

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

// API Keys routes (protected)
app.post('/api-keys', authMiddleware as any, (req: AuthRequest, res: Response) => {
  const { name } = req.body
  if (!name) {
    return res.status(400).json({ error: 'Name required' })
  }

  const { id, key, keyHash } = createApiKey(name)
  // Return plaintext key only once
  res.status(201).json({
    id,
    name,
    key, // ⚠️ Plaintext returned once only
    keyHash,
    createdAt: new Date(),
    revokedAt: null,
  })
})

app.get('/api-keys', authMiddleware as any, (req: AuthRequest, res: Response) => {
  const keys = listApiKeys()
  // Return without plaintext
  res.json({
    keys: keys.map((k) => ({
      id: k.id,
      name: k.name,
      createdAt: k.createdAt,
      revokedAt: k.revokedAt,
    })),
  })
})

app.delete('/api-keys/:id', authMiddleware as any, (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const success = revokeApiKey(id)
  if (!success) {
    return res.status(404).json({ error: 'API key not found' })
  }

  const key = getApiKey(id)
  res.json({ message: 'API key revoked', key })
})

// Provider Connection routes (protected, requires auth)
// POST /provider-connections: Create new provider connection with encrypted credentials
app.post('/provider-connections', authMiddleware as any, (req: AuthRequest, res: Response) => {
  const { dealerId, providerType, credentials } = req.body

  if (!dealerId || !providerType || !credentials) {
    return res.status(400).json({ error: 'dealerId, providerType, and credentials required' })
  }

  try {
    const connection = createProviderConnection(dealerId, providerType, credentials as ProviderCredentials)
    // Return metadata only, NEVER include encrypted field
    res.status(201).json({
      id: connection.id,
      dealerId: connection.dealerId,
      providerType: connection.providerType,
      createdAt: connection.createdAt,
      lastSyncedAt: connection.lastSyncedAt,
      lastSyncStatus: connection.lastSyncStatus,
      lastSyncError: connection.lastSyncError,
    })
  } catch (err) {
    console.error('[SECURITY] Failed to create provider connection:', err)
    res.status(500).json({ error: 'Failed to create provider connection' })
  }
})

// GET /provider-connections: List all connections for the authenticated dealer
app.get('/provider-connections', authMiddleware as any, (req: AuthRequest, res: Response) => {
  // In real app, extract dealerId from JWT
  const dealerId = req.userId || 'default-dealer'

  try {
    const connections = listProviderConnections(dealerId)
    res.json({ connections })
  } catch (err) {
    console.error('[SECURITY] Failed to list provider connections:', err)
    res.status(500).json({ error: 'Failed to list provider connections' })
  }
})

// GET /provider-connections/:id: Get specific connection (metadata only)
app.get('/provider-connections/:id', authMiddleware as any, (req: AuthRequest, res: Response) => {
  const { id } = req.params

  try {
    const connection = getProviderConnection(id)
    if (!connection) {
      return res.status(404).json({ error: 'Provider connection not found' })
    }

    res.json(connection)
  } catch (err) {
    console.error('[SECURITY] Failed to retrieve provider connection:', err)
    res.status(500).json({ error: 'Failed to retrieve provider connection' })
  }
})

// DELETE /provider-connections/:id: Revoke a provider connection
app.delete('/provider-connections/:id', authMiddleware as any, (req: AuthRequest, res: Response) => {
  const { id } = req.params

  try {
    const success = revokeProviderConnection(id)
    if (!success) {
      return res.status(404).json({ error: 'Provider connection not found' })
    }

    res.json({ message: 'Provider connection revoked' })
  } catch (err) {
    console.error('[SECURITY] Failed to revoke provider connection:', err)
    res.status(500).json({ error: 'Failed to revoke provider connection' })
  }
})

// POST /sync/:connectionId: Trigger sync for a provider connection
app.post('/sync/:connectionId', authMiddleware as any, async (req: AuthRequest, res: Response) => {
  const { connectionId } = req.params
  const correlationId = getCorrelationId(req as RequestWithCorrelation)

  try {
    // Get connection to determine provider type
    const connection = getProviderConnection(connectionId)
    if (!connection) {
      return res.status(404).json({ error: 'Provider connection not found' })
    }

    // Get the appropriate adapter
    let adapter
    try {
      adapter = getAdapter(connection.providerType)
    } catch (err) {
      return res.status(400).json({ error: `Unsupported provider type: ${connection.providerType}` })
    }

    // Trigger sync with correlation ID
    const result = await syncProviderConnection(connectionId, connection.dealerId, adapter, correlationId)

    res.json({
      ...result,
      connectionId,
      providerType: connection.providerType,
      correlationId,
    })
  } catch (err) {
    console.error('[Sync] Failed to trigger sync:', err)
    res.status(500).json({ error: 'Failed to trigger sync' })
  }
})

// GET /vehicles: List vehicles with filters (requires auth or API key)
app.get('/vehicles', (req: Request, res: Response, next) => {
  // Allow both JWT auth and API key
  const hasApiKey = req.headers['x-api-key']
  const hasAuth = req.headers.authorization?.startsWith('Bearer ')

  if (hasApiKey) {
    return apiKeyMiddleware(req as AuthRequest, res, next)
  } else if (hasAuth) {
    return authMiddleware(req as AuthRequest, res, next)
  } else {
    return res.status(401).json({ error: 'Authentication required' })
  }
}, (req: AuthRequest, res: Response) => {
  try {
    const dealerId = req.query.dealerId as string
    const query = req.query.query as string
    const status = req.query.status as 'available' | 'sold' | 'pending' | undefined
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0

    const vehicles = listVehicles({
      dealerId,
      query,
      status,
      limit,
      offset,
    })

    const total = countVehicles({ dealerId, query, status })

    res.json({
      vehicles,
      pagination: {
        limit,
        offset,
        total,
      },
    })
  } catch (err) {
    console.error('[Vehicles] Failed to list vehicles:', err)
    res.status(500).json({ error: 'Failed to list vehicles' })
  }
})

// GET /vehicles/:id: Get vehicle details
app.get('/vehicles/:id', authMiddleware as any, (req: AuthRequest, res: Response) => {
  const { id } = req.params

  try {
    const vehicle = getVehicle(id)
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' })
    }

    res.json(vehicle)
  } catch (err) {
    console.error('[Vehicles] Failed to get vehicle:', err)
    res.status(500).json({ error: 'Failed to get vehicle' })
  }
})

// GET /listing/:vehicleId: Generate listing package (export-ready content)
app.get('/listing/:vehicleId', authMiddleware as any, (req: AuthRequest, res: Response) => {
  const { vehicleId } = req.params

  try {
    const vehicle = getVehicle(vehicleId)
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' })
    }

    const listing = generateListingPackage(vehicle)
    res.json(listing)
  } catch (err) {
    console.error('[Listing] Failed to generate listing:', err)
    res.status(500).json({ error: 'Failed to generate listing' })
  }
})

// Diagnostic endpoints (for troubleshooting missing inventory)

// GET /diagnostics/sync-logs/:connectionId: Get sync history for a connection
app.get('/diagnostics/sync-logs/:connectionId', authMiddleware as any, (req: AuthRequest, res: Response) => {
  const { connectionId } = req.params

  try {
    const connection = getProviderConnection(connectionId)
    if (!connection) {
      return res.status(404).json({ error: 'Provider connection not found' })
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50
    const logs = getSyncLogsByConnection(connectionId, limit)

    res.json({
      connectionId,
      providerType: connection.providerType,
      totalLogs: logs.length,
      logs,
    })
  } catch (err) {
    console.error('[Diagnostics] Failed to retrieve sync logs:', err)
    res.status(500).json({ error: 'Failed to retrieve sync logs' })
  }
})

// GET /diagnostics/sync-logs/dealer/:dealerId: Get all sync logs for a dealer
app.get('/diagnostics/sync-logs/dealer/:dealerId', authMiddleware as any, (req: AuthRequest, res: Response) => {
  const { dealerId } = req.params

  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100
    const logs = getSyncLogsByDealer(dealerId, limit)

    res.json({
      dealerId,
      totalLogs: logs.length,
      logs,
    })
  } catch (err) {
    console.error('[Diagnostics] Failed to retrieve dealer sync logs:', err)
    res.status(500).json({ error: 'Failed to retrieve sync logs' })
  }
})

// GET /diagnostics/sync-status/:connectionId: Get last sync status for a connection
app.get('/diagnostics/sync-status/:connectionId', authMiddleware as any, (req: AuthRequest, res: Response) => {
  const { connectionId } = req.params

  try {
    const connection = getProviderConnection(connectionId)
    if (!connection) {
      return res.status(404).json({ error: 'Provider connection not found' })
    }

    const lastSync = getLastSyncStatus(connectionId)

    res.json({
      connectionId,
      providerType: connection.providerType,
      lastSync: lastSync || {
        message: 'No syncs yet',
      },
      connectionStatus: {
        lastSyncedAt: connection.lastSyncedAt,
        lastSyncStatus: connection.lastSyncStatus,
        lastSyncError: connection.lastSyncError,
      },
    })
  } catch (err) {
    console.error('[Diagnostics] Failed to retrieve sync status:', err)
    res.status(500).json({ error: 'Failed to retrieve sync status' })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`)
  console.log(`✓ Health check: http://localhost:${PORT}/health`)
  console.log(`✓ Auth: POST http://localhost:${PORT}/auth/login`)
  console.log(`✓ Protected: GET http://localhost:${PORT}/me (requires JWT)`)
  console.log(`✓ API Keys: POST http://localhost:${PORT}/api-keys (requires JWT)`)
  console.log(`✓ API Keys: GET http://localhost:${PORT}/api-keys (requires JWT)`)
  console.log(`✓ API Keys: DELETE http://localhost:${PORT}/api-keys/:id (requires JWT)`)
  console.log(`✓ Provider Connections: POST http://localhost:${PORT}/provider-connections (requires JWT)`)
  console.log(`✓ Provider Connections: GET http://localhost:${PORT}/provider-connections (requires JWT)`)
  console.log(`✓ Provider Connections: GET http://localhost:${PORT}/provider-connections/:id (requires JWT)`)
  console.log(`✓ Provider Connections: DELETE http://localhost:${PORT}/provider-connections/:id (requires JWT)`)
  console.log(`✓ Sync: POST http://localhost:${PORT}/sync/:connectionId (requires JWT)`)
  console.log(`✓ Vehicles: GET http://localhost:${PORT}/vehicles (requires JWT or API Key)`)
  console.log(`✓ Vehicles: GET http://localhost:${PORT}/vehicles/:id (requires JWT)`)
  console.log(`✓ Listing: GET http://localhost:${PORT}/listing/:vehicleId (requires JWT)`)
  console.log(`✓ Diagnostics: GET http://localhost:${PORT}/diagnostics/sync-logs/:connectionId (requires JWT)`)
  console.log(`✓ Diagnostics: GET http://localhost:${PORT}/diagnostics/sync-logs/dealer/:dealerId (requires JWT)`)
  console.log(`✓ Diagnostics: GET http://localhost:${PORT}/diagnostics/sync-status/:connectionId (requires JWT)`)
})
