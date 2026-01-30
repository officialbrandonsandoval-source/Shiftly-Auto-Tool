export interface FacebookMarketplaceCredentials {
    accessToken: string;
    userId: string;
    pageId?: string;
}
export interface FacebookMarketplacePost {
    title: string;
    description: string;
    price: number;
    currency: string;
    imageUrl: string;
    condition: 'NEW' | 'REFURBISHED' | 'USED';
    availability: 'AVAILABLE' | 'PENDING' | 'SOLD';
}
export interface FacebookPostResult {
    postId: string;
    status: 'success' | 'error';
    error?: string;
    url?: string;
}
/**
 * Post a vehicle listing to Facebook Marketplace
 */
export declare function postToMarketplace(credentials: FacebookMarketplaceCredentials, listing: FacebookMarketplacePost): Promise<FacebookPostResult>;
/**
 * Get metrics for a posted listing (impressions, clicks, etc.)
 */
export declare function getMarketplaceMetrics(credentials: FacebookMarketplaceCredentials, postId: string): Promise<any>;
/**
 * Delete a marketplace listing
 */
export declare function deleteMarketplacePost(credentials: FacebookMarketplaceCredentials, postId: string): Promise<boolean>;
/**
 * Validate access token is still valid
 */
export declare function validateAccessToken(credentials: FacebookMarketplaceCredentials): Promise<boolean>;
//# sourceMappingURL=FacebookMarketplace.d.ts.map