import crypto from 'crypto'
import { encrypt, decrypt, EncryptedData } from './encryption.js'

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'dev-encryption-secret-change-in-production'

export interface ProviderCredentials {
  [key: string]: string
}

export interface ProviderConnection {
  id: string
  dealerId: string
  providerType: string
  // Encrypted storage - NEVER log these values
  encrypted: EncryptedData
  // Metadata (safe to return)
  createdAt: Date
  lastSyncedAt: Date | null
  lastSyncStatus: 'pending' | 'success' | 'error'
  lastSyncError: string | null
}

// In-memory store (in production, use database)
const providerConnections: Map<string, ProviderConnection> = new Map()

/**
 * Creates a new provider connection with encrypted credentials
 * Credentials are encrypted immediately; never stored or logged in plaintext
 */
export function createProviderConnection(
  dealerId: string,
  providerType: string,
  credentials: ProviderCredentials
): ProviderConnection {
  const id = crypto.randomUUID()

  // Serialize credentials to JSON, then encrypt
  const credentialsJson = JSON.stringify(credentials)
  const encrypted = encrypt(credentialsJson, ENCRYPTION_SECRET)

  const connection: ProviderConnection = {
    id,
    dealerId,
    providerType,
    encrypted,
    createdAt: new Date(),
    lastSyncedAt: null,
    lastSyncStatus: 'pending',
    lastSyncError: null,
  }

  providerConnections.set(id, connection)
  return connection
}

/**
 * Retrieves decrypted credentials from a provider connection
 * ONLY call this when you need to actually use the credentials
 * Never return decrypted credentials to client
 */
export function getDecryptedCredentials(connectionId: string): ProviderCredentials | null {
  const connection = providerConnections.get(connectionId)
  if (!connection) {
    return null
  }

  try {
    const decryptedJson = decrypt(connection.encrypted, ENCRYPTION_SECRET)
    return JSON.parse(decryptedJson) as ProviderCredentials
  } catch (err) {
    console.error(`[SECURITY] Failed to decrypt credentials for connection ${connectionId}:`, err)
    return null
  }
}

/**
 * Returns provider connection metadata WITHOUT encrypted fields
 * Safe to return to client
 */
export function getProviderConnection(connectionId: string): Omit<ProviderConnection, 'encrypted'> | null {
  const connection = providerConnections.get(connectionId)
  if (!connection) {
    return null
  }

  // Return without encrypted field
  const { encrypted, ...safe } = connection
  return safe
}

/**
 * Lists all provider connections for a dealer (safe metadata only)
 */
export function listProviderConnections(dealerId: string): Array<Omit<ProviderConnection, 'encrypted'>> {
  return Array.from(providerConnections.values())
    .filter((c) => c.dealerId === dealerId)
    .map(({ encrypted, ...safe }) => safe)
}

/**
 * Revokes a provider connection
 * In production, mark as deleted rather than removing
 */
export function revokeProviderConnection(connectionId: string): boolean {
  return providerConnections.delete(connectionId)
}

/**
 * Updates sync status after a sync attempt
 * Use this to track last sync timestamp and any errors
 */
export function updateSyncStatus(
  connectionId: string,
  status: 'success' | 'error',
  error?: string
): boolean {
  const connection = providerConnections.get(connectionId)
  if (!connection) {
    return false
  }

  connection.lastSyncedAt = new Date()
  connection.lastSyncStatus = status
  connection.lastSyncError = error || null

  return true
}
