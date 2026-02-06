/**
 * TikTok integration adapter
 * Posts vehicle videos/photos to TikTok via TikTok for Business API
 */
export interface TikTokCredentials {
    accessToken: string;
    advertiserId: string;
}
export interface TikTokPost {
    videoUrl: string;
    caption: string;
    hashtags: string[];
    coverImageUrl?: string;
}
export interface TikTokPostResult {
    postId: string;
    status: 'success' | 'error';
    error?: string;
    url?: string;
}
/**
 * Post a vehicle video to TikTok
 * Note: TikTok API primarily focuses on advertising; organic posting requires creator tools
 */
export declare function postToTikTok(credentials: TikTokCredentials, post: TikTokPost): Promise<TikTokPostResult>;
/**
 * Get TikTok video metrics (views, likes, shares, comments)
 */
export declare function getTikTokMetrics(credentials: TikTokCredentials, postId: string): Promise<{
    views: number;
    likes: number;
    shares: number;
    comments: number;
}>;
/**
 * Validate TikTok credentials
 */
export declare function validateTikTokCredentials(credentials: TikTokCredentials): Promise<boolean>;
/**
 * Delete a TikTok video
 */
export declare function deleteTikTokPost(credentials: TikTokCredentials, postId: string): Promise<boolean>;
/**
 * Generate TikTok-optimized hashtags for automotive content
 */
export declare function generateTikTokHashtags(make: string, model: string, year: number, price: number): string[];
//# sourceMappingURL=TikTok.d.ts.map