/**
 * Listing package generator - creates export-ready content from a vehicle
 * Formats vehicle data for posting to classified sites, social, etc.
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
/**
 * Generate a listing package from a vehicle
 */
export declare function generateListingPackage(vehicle: Vehicle): ListingPackage;
//# sourceMappingURL=listing.d.ts.map