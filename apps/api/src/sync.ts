import crypto from 'crypto'
import { encrypt, decrypt, EncryptedData } from './encryption.js'
import { getDecryptedCredentials, updateSyncStatus } from './providers.js'
import { upsertVehicle } from './vehicles.js'
import { ProviderAdapter, SyncResult } from './adapters/types.js'
import { MockProvider } from './adapters/MockProvider.js'
import { CazooProvider } from './adapters/CazooProvider.js'
import { AutotraderProvider } from './adapters/AutotraderProvider.js'
import { createSyncLog, completeSyncLog, logWithCorrelation } from './syncLogs.js'

/**
 * Get the appropriate adapter for a provider type
 */
export function getAdapter(providerType: string): ProviderAdapter {
  switch (providerType) {
    case 'mock':
      return new MockProvider()
    case 'cazoo':
      return new CazooProvider()
    case 'autotrader':
      return new AutotraderProvider()
    default:
      throw new Error(`Unsupported provider type: ${providerType}`)
  }
}

/**
 * Sync vehicles from a provider connection
 * This is idempotent - running multiple times won't create duplicates
 */
export async function syncProviderConnection(
  connectionId: string,
  dealerId: string,
  adapter: ProviderAdapter,
  correlationId: string = crypto.randomUUID()
): Promise<SyncResult & { logId: string }> {
  const errors: string[] = []
  let vehiclesImported = 0
  let vehiclesUpdated = 0

  // Create sync log entry
  const syncLog = createSyncLog(connectionId, dealerId, adapter.providerType, correlationId)
  const logId = syncLog.id

  try {
    logWithCorrelation(correlationId, 'INFO', `Starting sync for connection ${connectionId}`)

    // Decrypt credentials
    const credentials = getDecryptedCredentials(connectionId)
    if (!credentials) {
      throw new Error('Failed to decrypt provider credentials')
    }

    // Test connection first
    const isConnected = await adapter.testConnection(credentials)
    if (!isConnected) {
      throw new Error('Provider connection test failed')
    }

    logWithCorrelation(correlationId, 'INFO', `Connection test passed for ${adapter.providerType}`)

    // Fetch vehicles from provider
    const providerVehicles = await adapter.fetchVehicles(credentials)
    logWithCorrelation(correlationId, 'INFO', `Fetched ${providerVehicles.length} vehicles`, {
      provider: adapter.providerType,
    })

    // Upsert each vehicle
    for (const providerVehicle of providerVehicles) {
      try {
        const existingVehicleCheck = await import('./vehicles.js').then((m) =>
          m.listVehicles({ dealerId, providerConnectionId: connectionId })
        )
        const existingVehicle = existingVehicleCheck.find(
          (v) => v.providerId === providerVehicle.providerId
        )

        const vehicle = upsertVehicle({
          dealerId,
          providerConnectionId: connectionId,
          providerId: providerVehicle.providerId,
          providerType: adapter.providerType,
          vin: providerVehicle.vin,
          year: providerVehicle.year,
          make: providerVehicle.make,
          model: providerVehicle.model,
          trim: providerVehicle.trim,
          mileage: providerVehicle.mileage,
          price: providerVehicle.price,
          condition: providerVehicle.condition,
          bodyType: providerVehicle.bodyType,
          transmission: providerVehicle.transmission,
          fuelType: providerVehicle.fuelType,
          exteriorColor: providerVehicle.exteriorColor,
          interiorColor: providerVehicle.interiorColor,
          description: providerVehicle.description,
          features: providerVehicle.features,
          photos: providerVehicle.photos,
          status: providerVehicle.status,
          lastSyncedAt: new Date(),
        })

        if (existingVehicle) {
          vehiclesUpdated++
        } else {
          vehiclesImported++
        }
      } catch (err) {
        const errorMsg = `Failed to upsert vehicle ${providerVehicle.providerId}: ${err}`
        logWithCorrelation(correlationId, 'ERROR', errorMsg)
        errors.push(errorMsg)
      }
    }

    // Update sync status
    updateSyncStatus(connectionId, 'success')
    completeSyncLog(logId, 'success', vehiclesImported, vehiclesUpdated, providerVehicles.length)

    logWithCorrelation(correlationId, 'INFO', 'Sync completed successfully', {
      imported: vehiclesImported,
      updated: vehiclesUpdated,
    })

    return {
      success: true,
      vehiclesImported,
      vehiclesUpdated,
      logId,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    logWithCorrelation(correlationId, 'ERROR', `Sync failed: ${errorMsg}`)

    // Update sync status with error
    updateSyncStatus(connectionId, 'error', errorMsg)
    completeSyncLog(logId, 'error', vehiclesImported, vehiclesUpdated, 0, errorMsg)

    return {
      success: false,
      vehiclesImported,
      vehiclesUpdated,
      logId,
      errors: [errorMsg, ...errors],
    }
  }
}
