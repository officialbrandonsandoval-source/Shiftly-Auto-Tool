/**
 * API client for PONS Auto backend
 */

import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { Vehicle, VehicleListResponse, AuthResponse } from '../types'

function getApiBaseUrl(): string {
  // Expo dev server exposes the host machine IP via hostUri (e.g. "192.168.1.5:8081")
  const debuggerHost =
    Constants.expoConfig?.hostUri ?? Constants.experienceUrl ?? ''
  const host = debuggerHost.split(':')[0]

  if (host && host !== 'localhost' && Platform.OS !== 'web') {
    return `http://${host}:3001`
  }

  return 'http://localhost:3001'
}

const API_BASE_URL = getApiBaseUrl()

let authToken: string | null = null

export interface ListingPackage {
  title: string
  description: string
  specs: Record<string, string>
  photos: string[]
  plaintext: string
  markdown: string
  json: string
}

export function setAuthToken(token: string) {
  authToken = token
}

export function clearAuthToken() {
  authToken = null
}

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
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
 * Auth API
 */
export const authAPI = {
  async login(email: string): Promise<AuthResponse> {
    const response = await fetchAPI<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
    setAuthToken(response.token)
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
