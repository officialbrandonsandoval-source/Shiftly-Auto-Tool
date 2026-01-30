/**
 * Claude API client for Anthropic's LLM
 * Handles listing generation with streaming support for real-time UI updates
 */
export interface GenerateListingOptions {
    make: string;
    model: string;
    year: number;
    price: number;
    mileage: number;
    condition: string;
    description?: string;
    features?: string[];
    transmission?: string;
    fuelType?: string;
    vin?: string;
}
export interface ListingVariations {
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
    estimatedTokens: number;
}
/**
 * Generate platform-optimized listing copy with Claude
 */
export declare function generateListingVariations(options: GenerateListingOptions): Promise<ListingVariations>;
/**
 * Generate listing with streaming for real-time mobile updates
 */
export declare function generateListingVariationsStream(options: GenerateListingOptions, onChunk: (chunk: string) => void): Promise<ListingVariations>;
/**
 * Rank photos by quality using Claude Vision
 * (Future enhancement - for now returns default ranking)
 */
export declare function rankPhotosByQuality(imageUrls: string[]): Promise<number[]>;
//# sourceMappingURL=claudeClient.d.ts.map