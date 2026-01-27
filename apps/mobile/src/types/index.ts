/**
 * Type definitions for the mobile app
 * These match the backend API types
 */

export interface Vehicle {
  id: string
  dealerId: string
  providerConnectionId: string
  providerId: string
  providerType: string
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
  createdAt: string
  updatedAt: string
  lastSyncedAt: string
}

export interface VehicleListResponse {
  vehicles: Vehicle[]
  pagination: {
    limit: number
    offset: number
    total: number
  }
}

export interface AuthResponse {
  token: string
  user: {
    email: string
  }
}
