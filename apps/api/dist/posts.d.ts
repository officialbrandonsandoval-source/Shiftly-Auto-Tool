/**
 * Post represents a vehicle listing posted to a platform (Facebook Marketplace, etc.)
 * Tracks: which vehicle, which platform, post ID, status, performance metrics
 */
export interface Post {
    id: string;
    vehicleId: string;
    dealerId: string;
    platform: 'facebook_marketplace' | 'craigslist' | 'instagram' | 'tiktok';
    platformPostId: string;
    status: 'posted' | 'archived' | 'deleted' | 'failed';
    createdAt: Date;
    postedAt: Date | null;
    archivedAt: Date | null;
    deletedAt: Date | null;
    impressions: number;
    clicks: number;
    leads: number;
    conversions: number;
    lastMetricsUpdateAt: Date | null;
    errorMessage: string | null;
}
/**
 * Creates a new post record
 */
export declare function createPost(vehicleId: string, dealerId: string, platform: Post['platform'], platformPostId: string): Post;
/**
 * Gets a post by ID
 */
export declare function getPost(postId: string): Post | null;
/**
 * Gets all posts for a vehicle
 */
export declare function getPostsByVehicle(vehicleId: string): Post[];
/**
 * Gets all posts for a dealer
 */
export declare function getPostsByDealer(dealerId: string): Post[];
/**
 * Gets all posts for a dealer on a specific platform
 */
export declare function getPostsByDealerAndPlatform(dealerId: string, platform: Post['platform']): Post[];
/**
 * Updates post status (e.g., mark as archived after sale)
 */
export declare function updatePostStatus(postId: string, status: Post['status']): boolean;
/**
 * Updates post metrics (called daily from analytics collector)
 */
export declare function updatePostMetrics(postId: string, metrics: {
    impressions: number;
    clicks: number;
    leads: number;
    conversions: number;
}): boolean;
/**
 * Records a posting failure
 */
export declare function recordPostError(postId: string, errorMessage: string): boolean;
/**
 * Deletes a post record
 */
export declare function deletePost(postId: string): boolean;
/**
 * Gets all active (non-deleted, non-archived) posts for a dealer
 */
export declare function getActivePosts(dealerId: string): Post[];
//# sourceMappingURL=posts.d.ts.map