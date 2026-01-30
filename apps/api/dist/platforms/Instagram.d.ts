/**
 * Instagram integration adapter
 * Posts vehicle listings as Instagram posts/stories via Facebook Graph API
 */
export interface InstagramCredentials {
    accessToken: string;
    instagramBusinessAccountId: string;
}
export interface InstagramPost {
    imageUrl: string;
    caption: string;
    location?: {
        id: string;
        name: string;
    };
}
export interface InstagramPostResult {
    postId: string;
    status: 'success' | 'error';
    error?: string;
    url?: string;
}
/**
 * Post a vehicle photo to Instagram
 */
export declare function postToInstagram(credentials: InstagramCredentials, post: InstagramPost): Promise<InstagramPostResult>;
/**
 * Get Instagram post metrics (likes, comments, reach)
 */
export declare function getInstagramMetrics(credentials: InstagramCredentials, postId: string): Promise<{
    likes: number;
    comments: number;
    reach: number;
    impressions: number;
}>;
/**
 * Validate Instagram credentials
 */
export declare function validateInstagramCredentials(credentials: InstagramCredentials): Promise<boolean>;
/**
 * Delete an Instagram post
 */
export declare function deleteInstagramPost(credentials: InstagramCredentials, postId: string): Promise<boolean>;
//# sourceMappingURL=Instagram.d.ts.map