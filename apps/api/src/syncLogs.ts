/**
 * Sync logs - tracks all sync attempts for diagnostics
 * Helps dealers diagnose why inventory isn't syncing
 */

import crypto from 'crypto'

export interface SyncLog {
  id: string
  connectionId: string
  dealerId: string
  providerType: string
  status: 'pending' | 'running' | 'success' | 'error'
  vehiclesImported: number
  vehiclesUpdated: number
  totalVehicles: number
  startedAt: Date
  completedAt: Date | null
  error: string | null
  correlationId: string
  duration: number | null // milliseconds
}

// In-memory store (in production, use database)
const syncLogs: Map<string, SyncLog> = new Map()

/**
 * Create a new sync log entry
 */
export function createSyncLog(
  connectionId: string,
  dealerId: string,
  providerType: string,
  correlationId: string
): SyncLog {
  const id = crypto.randomUUID()
  const log: SyncLog = {
    id,
    connectionId,
    dealerId,
    providerType,
    status: 'running',
    vehiclesImported: 0,
    vehiclesUpdated: 0,
    totalVehicles: 0,
    startedAt: new Date(),
    completedAt: null,
    error: null,
    correlationId,
    duration: null,
  }

  syncLogs.set(id, log)
  return log
}

/**
 * Update a sync log after completion
 */
export function completeSyncLog(
  logId: string,
  status: 'success' | 'error',
  vehiclesImported: number,
  vehiclesUpdated: number,
  totalVehicles: number,
  error?: string
): SyncLog | null {
  const log = syncLogs.get(logId)
  if (!log) return null

  const now = new Date()
  log.status = status
  log.vehiclesImported = vehiclesImported
  log.vehiclesUpdated = vehiclesUpdated
  log.totalVehicles = totalVehicles
  log.completedAt = now
  log.duration = now.getTime() - log.startedAt.getTime()
  log.error = error || null

  return log
}

/**
 * Get a specific sync log
 */
export function getSyncLog(logId: string): SyncLog | undefined {
  return syncLogs.get(logId)
}

/**
 * Get sync logs by connection ID
 */
export function getSyncLogsByConnection(connectionId: string, limit: number = 50): SyncLog[] {
  return Array.from(syncLogs.values())
    .filter((log) => log.connectionId === connectionId)
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
    .slice(0, limit)
}

/**
 * Get sync logs by dealer ID
 */
export function getSyncLogsByDealer(dealerId: string, limit: number = 100): SyncLog[] {
  return Array.from(syncLogs.values())
    .filter((log) => log.dealerId === dealerId)
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
    .slice(0, limit)
}

/**
 * Get last sync status for a connection
 */
export function getLastSyncStatus(connectionId: string): SyncLog | null {
  const logs = getSyncLogsByConnection(connectionId, 1)
  return logs.length > 0 ? logs[0] : null
}

/**
 * Log with correlation ID for debugging
 */
export function logWithCorrelation(
  correlationId: string,
  level: string,
  message: string,
  data?: any
) {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${correlationId}] [${level}]`

  if (data) {
    console.log(`${prefix} ${message}`, data)
  } else {
    console.log(`${prefix} ${message}`)
  }
}
