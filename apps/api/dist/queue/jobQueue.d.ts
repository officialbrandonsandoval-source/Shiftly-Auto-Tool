/**
 * Job Queue for async tasks (Bull + Redis)
 * Handles posting, retries, rescheduling, analytics collection
 */
import Queue from 'bull';
/**
 * Job queue for posting to platforms
 */
export declare const postingQueue: Queue.Queue<any>;
/**
 * Job queue for retrying failed posts
 */
export declare const retryQueue: Queue.Queue<any>;
/**
 * Job queue for collecting analytics
 */
export declare const analyticsQueue: Queue.Queue<any>;
/**
 * Job queue for auto-reposting unsold vehicles
 */
export declare const repostQueue: Queue.Queue<any>;
export interface PostingJobData {
    vehicleId: string;
    platform: 'facebook_marketplace' | 'craigslist' | 'instagram' | 'tiktok';
    listingId: string;
    connectionId: string;
    dealerId: string;
    scheduledFor?: Date;
}
export interface RetryJobData {
    originalJobId: string;
    vehicleId: string;
    platform: string;
    connectionId: string;
    attemptNumber: number;
    error: string;
}
export interface AnalyticsJobData {
    postId: string;
    platform: string;
    connectionId: string;
}
export interface RepostJobData {
    vehicleId: string;
    platform: string;
    connectionId: string;
    dealerId: string;
    daysWithoutInteraction: number;
}
/**
 * Setup job queue event handlers
 */
export declare function setupQueueHandlers(): void;
/**
 * Add a posting job to the queue
 */
export declare function addPostingJob(data: PostingJobData, delay?: number): Promise<string>;
/**
 * Add a retry job for failed posts
 */
export declare function addRetryJob(data: RetryJobData): Promise<string>;
/**
 * Add an analytics collection job
 */
export declare function addAnalyticsJob(data: AnalyticsJobData): Promise<string>;
/**
 * Add a repost job for unsold vehicles
 */
export declare function addRepostJob(data: RepostJobData, delayMs?: number): Promise<string>;
/**
 * Get job status
 */
export declare function getJobStatus(jobId: string, queue: Queue.Queue): Promise<any>;
/**
 * Cancel a scheduled job
 */
export declare function cancelJob(jobId: string, queue: Queue.Queue): Promise<boolean>;
/**
 * Purge all jobs from a queue (careful!)
 */
export declare function purgeQueue(queue: Queue.Queue): Promise<void>;
//# sourceMappingURL=jobQueue.d.ts.map