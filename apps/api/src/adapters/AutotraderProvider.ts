/**
 * Autotrader Provider Adapter
 * Real integration with Autotrader API
 * https://developer.autotrader.co.uk/
 */

import { ProviderAdapter, ProviderVehicle, ProviderCredentials } from './types.js'

export class AutotraderProvider implements ProviderAdapter {
  providerType = 'autotrader'
  private baseUrl = 'https://api.autotrader.co.uk'
  private requestTimeout = 30000

  async testConnection(credentials: ProviderCredentials): Promise<boolean> {
    try {
      const response = await this.makeRequest('/listings', credentials, { limit: 1 })
      return response.success === true || response.listings?.length >= 0
    } catch (err) {
      console.error('[Autotrader] Connection test failed:', err)
      return false
    }
  }

  async fetchVehicles(credentials: ProviderCredentials): Promise<ProviderVehicle[]> {
    try {
      const response = await this.makeRequest('/listings', credentials, { limit: 1000 })

      if (!response.listings || !Array.isArray(response.listings)) {
        throw new Error('Invalid response format from Autotrader API')
      }

      return response.listings.map((item: any) => this.normalizeVehicle(item))
    } catch (err) {
      console.error('[Autotrader] Failed to fetch vehicles:', err)
      throw err
    }
  }

  async fetchVehicle(credentials: ProviderCredentials, providerId: string): Promise<ProviderVehicle | null> {
    try {
      const response = await this.makeRequest(`/listings/${providerId}`, credentials)

      if (!response || !response.listing) {
        return null
      }

      return this.normalizeVehicle(response.listing)
    } catch (err) {
      console.error(`[Autotrader] Failed to fetch vehicle ${providerId}:`, err)
      return null
    }
  }

  private async makeRequest(
    endpoint: string,
    credentials: ProviderCredentials,
    params?: Record<string, any>
  ): Promise<any> {
    const apiKey = credentials.apiKey
    if (!apiKey) {
      throw new Error('Missing Autotrader API key')
    }

    const url = new URL(`${this.baseUrl}${endpoint}`)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout)

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Autotrader API error: ${response.status} ${response.statusText}`)
      }

      return response.json()
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private normalizeVehicle(item: any): ProviderVehicle {
    return {
      providerId: item.id || item.listingId,
      vin: item.vin || 'UNKNOWN',
      year: item.year || new Date().getFullYear(),
      make: item.make || 'Unknown',
      model: item.model || 'Unknown',
      trim: item.trim || item.variant,
      mileage: item.mileage || item.odometer || 0,
      price: item.price || 0,
      condition: item.condition === 'New' ? 'new' : 'used',
      bodyType: item.bodyType || item.bodyStyle,
      transmission: item.transmission,
      fuelType: item.fuel,
      exteriorColor: item.color,
      interiorColor: item.interiorColor,
      description: item.description,
      features: item.features || [],
      photos: item.images || [],
      status: item.status === 'sold' ? 'sold' : 'available',
    }
  }
}
