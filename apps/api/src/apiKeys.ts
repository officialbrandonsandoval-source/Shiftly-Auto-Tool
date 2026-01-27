import crypto from 'crypto'

export interface ApiKey {
  id: string
  name: string
  keyHash: string
  createdAt: Date
  revokedAt: Date | null
}

// In-memory store (in production, use database)
const apiKeys: Map<string, ApiKey> = new Map()

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export function generateApiKey(): { id: string; key: string } {
  const id = crypto.randomUUID()
  const key = crypto.randomBytes(32).toString('hex')
  return { id, key }
}

export function createApiKey(name: string): { id: string; key: string; keyHash: string } {
  const { id, key } = generateApiKey()
  const keyHash = hashKey(key)

  apiKeys.set(id, {
    id,
    name,
    keyHash,
    createdAt: new Date(),
    revokedAt: null,
  })

  return { id, key, keyHash }
}

export function validateApiKey(key: string): string | null {
  const keyHash = hashKey(key)
  for (const [id, record] of apiKeys.entries()) {
    if (record.keyHash === keyHash && !record.revokedAt) {
      return id
    }
  }
  return null
}

export function listApiKeys(): ApiKey[] {
  return Array.from(apiKeys.values())
}

export function revokeApiKey(id: string): boolean {
  const key = apiKeys.get(id)
  if (key) {
    key.revokedAt = new Date()
    return true
  }
  return false
}

export function getApiKey(id: string): ApiKey | undefined {
  return apiKeys.get(id)
}
