/**
 * Job Processors - handle actual posting, retries, analytics, reposting
 */
/**
 * Process posting job - post vehicle to marketplace
 */
export declare function processPostingJob(job: any): Promise<any>;
/**
 * Process retry job - retry failed posting with backoff
 */
export declare function processRetryJob(job: any): Promise<any>;
/**
 * Process analytics job - fetch metrics from platform
 */
export declare function processAnalyticsJob(job: any): Promise<any>;
/**
 * Process repost job - auto-repost unsold vehicle
 */
export declare function processRepostJob(job: any): Promise<any>;
//# sourceMappingURL=processors.d.ts.map