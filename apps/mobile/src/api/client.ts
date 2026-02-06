/**
 * API client for PONS Auto backend
 * Authenticates via SAG API Key (X-API-Key header)
 */

import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { Vehicle, VehicleListResponse } from '../types'

function getApiBaseUrl(): string {
  const debuggerHost =
    Constants.expoConfig?.hostUri ?? Constants.experienceUrl ?? ''
  const host = debuggerHost.split(':')[0]

  if (host && host !== 'localhost' && Platform.OS !== 'web') {
    return `http://${host}:3001`
  }

  return 'http://localhost:3001'
}

const API_BASE_URL = getApiBaseUrl()

let currentApiKey: string | null = null

export function setApiKey(key: string) {
  currentApiKey = key
}

export function clearApiKey() {
  currentApiKey = null
}

export function getActiveApiKey(): string | null {
  return currentApiKey
}

export interface ListingPackage {
  title: string
  description: string
  specs: Record<string, string>
  photos: string[]
  plaintext: string
  markdown: string
  json: string
}

export interface VerifyKeyResponse {
  valid: boolean
  keyId: string
  name: string | null
}

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (currentApiKey) {
    headers['X-API-Key'] = currentApiKey
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Auth API — verify SAG API Key
 */
export const authAPI = {
  async verifyKey(apiKey: string): Promise<VerifyKeyResponse> {
    const response = await fetchAPI<VerifyKeyResponse>('/auth/verify-key', {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
    })
    setApiKey(apiKey)
    return response
  },
}

/**
 * Vehicles API
 */
export const vehiclesAPI = {
  async list(params?: {
    dealerId?: string
    query?: string
    status?: string
    limit?: number
    offset?: number
  }): Promise<VehicleListResponse> {
    const queryParams = new URLSearchParams()
    if (params?.dealerId) queryParams.append('dealerId', params.dealerId)
    if (params?.query) queryParams.append('query', params.query)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())

    const queryString = queryParams.toString()
    return fetchAPI<VehicleListResponse>(`/vehicles${queryString ? `?${queryString}` : ''}`)
  },

  async getById(id: string): Promise<Vehicle> {
    return fetchAPI<Vehicle>(`/vehicles/${id}`)
  },
}

/**
 * Listing API
 */
export const listingAPI = {
  async generate(vehicleId: string): Promise<ListingPackage> {
    return fetchAPI<ListingPackage>(`/listing/${vehicleId}`)
  },
}
