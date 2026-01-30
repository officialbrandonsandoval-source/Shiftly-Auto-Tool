/**
 * Listing package generator - creates export-ready content from a vehicle
 * Formats vehicle data for posting to classified sites, social, etc.
 * Includes AI-generated variations with platform-specific optimization
 */
import { Vehicle } from './vehicles.js';
export interface ListingPackage {
    title: string;
    description: string;
    specs: Record<string, string>;
    photos: string[];
    plaintext: string;
    markdown: string;
    json: string;
}
export interface AIGeneratedListing {
    id: string;
    vehicleId: string;
    facebook: {
        title: string;
        description: string;
    };
    craigslist: {
        title: string;
        description: string;
    };
    keywords: string[];
    photoRanking: number[];
    generatedAt: Date;
    baseListingPackage: ListingPackage;
}
/**
 * Generate a listing package from a vehicle
 */
export declare function generateListingPackage(vehicle: Vehicle): ListingPackage;
/**
 * Generate AI-optimized listing variations for a vehicle
 * Returns platform-specific copy (Facebook, Craigslist) + keywords + photo ranking
 */
export declare function generateAIListingVariations(vehicle: Vehicle): Promise<AIGeneratedListing>;
/**
 * Get a previously generated AI listing
 */
export declare function getAIListing(listingId: string): AIGeneratedListing | null;
/**
 * Get all AI listings for a vehicle
 */
export declare function getAIListingsByVehicle(vehicleId: string): AIGeneratedListing[];
//# sourceMappingURL=listing.d.ts.map