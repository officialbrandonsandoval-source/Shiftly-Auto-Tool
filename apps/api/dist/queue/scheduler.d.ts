/**
 * Posting Scheduler - intelligent scheduling for posts
 * Determines optimal times, handles recurring posts, manages unsold vehicle rotation
 */
export interface ScheduleOptions {
    immediatelyPost?: boolean;
    specificTime?: Date;
    recurringDays?: number;
    autoRepostIfUnsold?: boolean;
    optimalTiming?: boolean;
}
/**
 * Schedule a vehicle post
 */
export declare function schedulePost(vehicleId: string, platform: 'facebook_marketplace' | 'craigslist' | 'instagram' | 'tiktok', listingId: string, connectionId: string, dealerId: string, options?: ScheduleOptions): Promise<{
    jobId: string;
    scheduledFor: Date;
}>;
/**
 * Schedule recurring posts for a vehicle
 * (e.g., repost every 3 days)
 */
export declare function scheduleRecurringPosts(vehicleId: string, platform: 'facebook_marketplace' | 'craigslist', listingId: string, connectionId: string, dealerId: string, everyNDays: number): Promise<{
    jobIds: string[];
    nextPostTimes: Date[];
}>;
/**
 * Schedule auto-repost for unsold vehicles
 * Weekly check: if vehicle hasn't sold and has low engagement, repost
 */
export declare function scheduleAutoRepost(vehicleId: string, platform: 'facebook_marketplace' | 'craigslist', connectionId: string, dealerId: string): Promise<string>;
/**
 * Determine optimal posting time based on engagement patterns
 * For now: Thursday 9 AM (common peak engagement)
 * Future: ML-based per-market optimization
 */
export declare function getOptimalPostingTime(): Date;
/**
 * Calculate if vehicle should be reposted (low engagement heuristic)
 */
export declare function shouldRepostVehicle(impressions: number, clicks: number, daysListed: number): boolean;
/**
 * Get all dealer's scheduled posts from active jobs
 * (In production, query from DB)
 */
export declare function getScheduledPosts(dealerId: string, queue: any): Promise<any[]>;
//# sourceMappingURL=scheduler.d.ts.map