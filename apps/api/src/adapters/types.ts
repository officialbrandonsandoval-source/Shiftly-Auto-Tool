/**
 * Provider adapter interface
 * All provider integrations must implement this interface
 */

export interface ProviderVehicle {
  providerId: string // Unique ID in provider's system
  vin: string
  year: number
  make: string
  model: string
  trim?: string
  mileage: number
  price: number
  condition: 'new' | 'used' | 'certified'
  bodyType?: string
  transmission?: string
  fuelType?: string
  exteriorColor?: string
  interiorColor?: string
  description?: string
  features?: string[]
  photos?: string[]
  status: 'available' | 'sold' | 'pending'
}

export interface ProviderCredentials {
  [key: string]: string
}

export interface SyncResult {
  success: boolean
  vehiclesImported: number
  vehiclesUpdated: number
  errors?: string[]
}

/**
 * Base interface that all provider adapters must implement
 */
export interface ProviderAdapter {
  /** Provider type identifier (e.g., 'cazoo', 'autotrader', 'mock') */
  providerType: string

  /**
   * Test connection with provider credentials
   * Returns true if credentials are valid and connection works
   */
  testConnection(credentials: ProviderCredentials): Promise<boolean>

  /**
   * Fetch all vehicles from the provider
   * Returns array of vehicles in normalized format
   */
  fetchVehicles(credentials: ProviderCredentials): Promise<ProviderVehicle[]>

  /**
   * Fetch a single vehicle by its provider ID
   * Returns null if vehicle not found
   */
  fetchVehicle(credentials: ProviderCredentials, providerId: string): Promise<ProviderVehicle | null>
}
