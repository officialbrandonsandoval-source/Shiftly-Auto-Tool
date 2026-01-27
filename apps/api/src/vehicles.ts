/**
 * Vehicle model and storage
 * Represents inventory items synced from providers
 */

export interface Vehicle {
  id: string // Unique ID within our system
  dealerId: string
  providerConnectionId: string
  
  // Provider identifiers
  providerId: string // ID from the provider's system
  providerType: string // e.g., 'cazoo', 'autotrader', 'mock'
  
  // Basic info
  vin: string
  year: number
  make: string
  model: string
  trim?: string
  
  // Details
  mileage: number
  price: number
  condition: 'new' | 'used' | 'certified'
  bodyType?: string
  transmission?: string
  fuelType?: string
  exteriorColor?: string
  interiorColor?: string
  
  // Description
  description?: string
  features?: string[]
  
  // Photos
  photos?: string[] // Array of image URLs
  
  // Status
  status: 'available' | 'sold' | 'pending'
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  lastSyncedAt: Date
}

// In-memory store (in production, use database)
const vehicles: Map<string, Vehicle> = new Map()

/**
 * Upsert a vehicle (create or update)
 * Uses dealerId + providerId as unique key to prevent duplicates
 */
export function upsertVehicle(vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Vehicle {
  // Find existing vehicle by dealerId + providerId
  const existingVehicle = Array.from(vehicles.values()).find(
    (v) => v.dealerId === vehicle.dealerId && v.providerId === vehicle.providerId
  )

  const now = new Date()

  if (existingVehicle) {
    // Update existing vehicle
    const updated: Vehicle = {
      ...existingVehicle,
      ...vehicle,
      id: existingVehicle.id,
      createdAt: existingVehicle.createdAt,
      updatedAt: now,
    }
    vehicles.set(updated.id, updated)
    return updated
  } else {
    // Create new vehicle
    const newVehicle: Vehicle = {
      ...vehicle,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }
    vehicles.set(newVehicle.id, newVehicle)
    return newVehicle
  }
}

/**
 * Get a vehicle by ID
 */
export function getVehicle(id: string): Vehicle | undefined {
  return vehicles.get(id)
}

/**
 * List vehicles with optional filters
 */
export interface VehicleFilters {
  dealerId?: string
  providerConnectionId?: string
  status?: 'available' | 'sold' | 'pending'
  query?: string // Search make/model/vin
  limit?: number
  offset?: number
}

export function listVehicles(filters: VehicleFilters = {}): Vehicle[] {
  let results = Array.from(vehicles.values())

  // Filter by dealerId
  if (filters.dealerId) {
    results = results.filter((v) => v.dealerId === filters.dealerId)
  }

  // Filter by providerConnectionId
  if (filters.providerConnectionId) {
    results = results.filter((v) => v.providerConnectionId === filters.providerConnectionId)
  }

  // Filter by status
  if (filters.status) {
    results = results.filter((v) => v.status === filters.status)
  }

  // Search query
  if (filters.query) {
    const query = filters.query.toLowerCase()
    results = results.filter(
      (v) =>
        v.make.toLowerCase().includes(query) ||
        v.model.toLowerCase().includes(query) ||
        v.vin.toLowerCase().includes(query)
    )
  }

  // Sort by updatedAt desc (newest first)
  results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

  // Pagination
  const offset = filters.offset || 0
  const limit = filters.limit || 50
  return results.slice(offset, offset + limit)
}

/**
 * Count vehicles matching filters
 */
export function countVehicles(filters: VehicleFilters = {}): number {
  return listVehicles({ ...filters, limit: 999999 }).length
}

/**
 * Delete a vehicle
 */
export function deleteVehicle(id: string): boolean {
  return vehicles.delete(id)
}
