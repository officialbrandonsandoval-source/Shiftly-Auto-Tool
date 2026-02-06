/**
 * Listing package generator - creates export-ready content from a vehicle
 * Formats vehicle data for posting to classified sites, social, etc.
 * Includes AI-generated variations with platform-specific optimization
 */

import { Vehicle } from './vehicles.js'
import { generateListingVariations, ListingVariations, GenerateListingOptions } from './ai/claudeClient.js'
import crypto from 'crypto'

export interface ListingPackage {
  title: string
  description: string
  specs: Record<string, string>
  photos: string[]
  plaintext: string // Full plaintext version for copy
  markdown: string // Markdown formatted
  json: string // JSON export
}

export interface AIGeneratedListing {
  id: string
  vehicleId: string
  facebook: {
    title: string
    description: string
  }
  craigslist: {
    title: string
    description: string
  }
  keywords: string[]
  photoRanking: number[]
  generatedAt: Date
  baseListingPackage: ListingPackage
}

// Cache of generated listings (in production, use DB)
const generatedListings: Map<string, AIGeneratedListing> = new Map()

/**
 * Generate a listing package from a vehicle
 */
export function generateListingPackage(vehicle: Vehicle): ListingPackage {
  // Title: Year Make Model Trim
  const title = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
    .filter(Boolean)
    .join(' ')

  // Generate specs object
  const specs: Record<string, string> = {
    Price: formatPrice(vehicle.price),
    Mileage: formatMileage(vehicle.mileage),
    VIN: vehicle.vin,
    Condition: vehicle.condition.charAt(0).toUpperCase() + vehicle.condition.slice(1),
    Year: vehicle.year.toString(),
    Make: vehicle.make,
    Model: vehicle.model,
  }

  if (vehicle.trim) specs['Trim'] = vehicle.trim
  if (vehicle.bodyType) specs['Body Type'] = vehicle.bodyType
  if (vehicle.transmission) specs['Transmission'] = vehicle.transmission
  if (vehicle.fuelType) specs['Fuel Type'] = vehicle.fuelType
  if (vehicle.exteriorColor) specs['Exterior Color'] = vehicle.exteriorColor
  if (vehicle.interiorColor) specs['Interior Color'] = vehicle.interiorColor

  // Generate description
  const descriptionParts = [
    `${title} - ${formatPrice(vehicle.price)}`,
    '',
    vehicle.description || generateDefaultDescription(vehicle),
    '',
    'Key Details:',
    ...Object.entries(specs).map(([key, value]) => `  • ${key}: ${value}`),
  ]

  if (vehicle.features && vehicle.features.length > 0) {
    descriptionParts.push('')
    descriptionParts.push('Features:')
    descriptionParts.push(...vehicle.features.map((f) => `  • ${f}`))
  }

  const plaintext = descriptionParts.join('\n')

  // Markdown version
  const markdownParts = [
    `# ${title}`,
    `**${formatPrice(vehicle.price)}** | ${formatMileage(vehicle.mileage)}`,
    '',
    vehicle.description || generateDefaultDescription(vehicle),
    '',
    '## Specifications',
    ...Object.entries(specs).map(([key, value]) => `- **${key}:** ${value}`),
  ]

  if (vehicle.features && vehicle.features.length > 0) {
    markdownParts.push('')
    markdownParts.push('## Features')
    markdownParts.push(...vehicle.features.map((f) => `- ${f}`))
  }

  const markdown = markdownParts.join('\n')

  // JSON export
  const json = JSON.stringify(
    {
      listing: {
        title,
        price: vehicle.price,
        mileage: vehicle.mileage,
        vin: vehicle.vin,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        trim: vehicle.trim,
        condition: vehicle.condition,
        specs,
        description: vehicle.description,
        features: vehicle.features || [],
        photos: vehicle.photos || [],
      },
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  )

  return {
    title,
    description: vehicle.description || generateDefaultDescription(vehicle),
    specs,
    photos: vehicle.photos || [],
    plaintext,
    markdown,
    json,
  }
}

function generateDefaultDescription(vehicle: Vehicle): string {
  return `${vehicle.year} ${vehicle.make} ${vehicle.model} - ${vehicle.condition} condition with ${formatMileage(vehicle.mileage)}. Priced at ${formatPrice(vehicle.price)}.`
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(price)
}

function formatMileage(mileage: number): string {
  return new Intl.NumberFormat('en-US').format(mileage) + ' miles'
}

/**
 * Generate AI-optimized listing variations for a vehicle
 * Returns platform-specific copy (Facebook, Craigslist) + keywords + photo ranking
 */
export async function generateAIListingVariations(vehicle: Vehicle): Promise<AIGeneratedListing> {
  const basePackage = generateListingPackage(vehicle)

  const claudeOptions: GenerateListingOptions = {
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    price: vehicle.price,
    mileage: vehicle.mileage,
    condition: vehicle.condition,
    description: vehicle.description,
    features: vehicle.features,
    transmission: vehicle.transmission,
    fuelType: vehicle.fuelType,
    vin: vehicle.vin,
  }

  // Generate with Claude
  const variations = await generateListingVariations(claudeOptions)

  const id = crypto.randomUUID()
  const aiListing: AIGeneratedListing = {
    id,
    vehicleId: vehicle.id,
    facebook: variations.facebook,
    craigslist: variations.craigslist,
    keywords: variations.keywords,
    photoRanking: variations.photoRanking,
    generatedAt: new Date(),
    baseListingPackage: basePackage,
  }

  // Cache it
  generatedListings.set(id, aiListing)

  return aiListing
}

/**
 * Get a previously generated AI listing
 */
export function getAIListing(listingId: string): AIGeneratedListing | null {
  return generatedListings.get(listingId) || null
}

/**
 * Get all AI listings for a vehicle
 */
export function getAIListingsByVehicle(vehicleId: string): AIGeneratedListing[] {
  return Array.from(generatedListings.values()).filter((l) => l.vehicleId === vehicleId)
}

