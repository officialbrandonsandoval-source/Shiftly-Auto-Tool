/**
 * Craigslist integration adapter
 * Posts vehicle listings to Craigslist using their API/posting interface
 */
export interface CraigslistCredentials {
    accountId: string;
    apiKey: string;
    city: string;
}
export interface CraigslistPost {
    title: string;
    description: string;
    price: number;
    location: string;
    category: string;
    imageUrls: string[];
    contactEmail: string;
    contactPhone?: string;
    vin: string;
    make: string;
    model: string;
    year: number;
    odometer: number;
    condition: 'new' | 'like-new' | 'excellent' | 'good' | 'fair' | 'salvage';
    transmission: 'manual' | 'automatic' | 'other';
    fuelType: 'gas' | 'diesel' | 'hybrid' | 'electric' | 'other';
}
export interface CraigslistPostResult {
    postId: string;
    status: 'success' | 'error';
    error?: string;
    url?: string;
}
/**
 * Post a vehicle listing to Craigslist
 * Note: Craigslist API is not public - this is a conceptual implementation
 * In production, use Craigslist's bulk posting tool or third-party services
 */
export declare function postToCraigslist(credentials: CraigslistCredentials, listing: CraigslistPost): Promise<CraigslistPostResult>;
/**
 * Validate Craigslist account credentials
 */
export declare function validateCraigslistCredentials(credentials: CraigslistCredentials): Promise<boolean>;
/**
 * Get Craigslist metrics (renewal tracking, view counts)
 * Note: Craigslist provides limited analytics via account dashboard
 */
export declare function getCraigslistMetrics(credentials: CraigslistCredentials, postId: string): Promise<{
    views: number;
    replies: number;
}>;
/**
 * Delete/expire a Craigslist post
 */
export declare function deleteCraigslistPost(credentials: CraigslistCredentials, postId: string): Promise<boolean>;
/**
 * Renew a Craigslist post (brings it to top of listings)
 * Craigslist allows renewal every 48 hours
 */
export declare function renewCraigslistPost(credentials: CraigslistCredentials, postId: string): Promise<boolean>;
//# sourceMappingURL=Craigslist.d.ts.map