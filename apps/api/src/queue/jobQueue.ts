/**
 * Job Queue for async tasks (Bull + Redis)
 * Handles posting, retries, rescheduling, analytics collection
 */

import Queue from 'bull'

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379'

/**
 * Job queue for posting to platforms
 */
export const postingQueue = new Queue('posting', REDIS_URL)

/**
 * Job queue for retrying failed posts
 */
export const retryQueue = new Queue('retry', REDIS_URL)

/**
 * Job queue for collecting analytics
 */
export const analyticsQueue = new Queue('analytics', REDIS_URL)

/**
 * Job queue for auto-reposting unsold vehicles
 */
export const repostQueue = new Queue('repost', REDIS_URL)

export interface PostingJobData {
  vehicleId: string
  platform: 'facebook_marketplace' | 'craigslist' | 'instagram' | 'tiktok'
  listingId: string
  connectionId: string
  dealerId: string
  scheduledFor?: Date
}

export interface RetryJobData {
  originalJobId: string
  vehicleId: string
  platform: string
  connectionId: string
  attemptNumber: number
  error: string
}

export interface AnalyticsJobData {
  postId: string
  platform: string
  connectionId: string
}

export interface RepostJobData {
  vehicleId: string
  platform: string
  connectionId: string
  dealerId: string
  daysWithoutInteraction: number
}

/**
 * Setup job queue event handlers
 */
export function setupQueueHandlers() {
  postingQueue.on('completed', (job) => {
    console.log(`[Queue] Posting job ${job.id} completed for vehicle ${job.data.vehicleId}`)
  })

  postingQueue.on('failed', (job, err) => {
    console.error(`[Queue] Posting job ${job.id} failed:`, err.message)
  })

  retryQueue.on('completed', (job) => {
    console.log(`[Queue] Retry job ${job.id} completed (attempt ${job.data.attemptNumber})`)
  })

  analyticsQueue.on('completed', (job) => {
    console.log(`[Queue] Analytics job ${job.id} completed for post ${job.data.postId}`)
  })

  repostQueue.on('completed', (job) => {
    console.log(`[Queue] Repost job ${job.id} completed for vehicle ${job.data.vehicleId}`)
  })
}

/**
 * Add a posting job to the queue
 */
export async function addPostingJob(data: PostingJobData, delay?: number): Promise<string> {
  const options: any = {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
  }

  if (delay) {
    options.delay = delay
  }

  const job = await postingQueue.add(data, options)
  return job.id.toString()
}

/**
 * Add a retry job for failed posts
 */
export async function addRetryJob(data: RetryJobData): Promise<string> {
  const job = await retryQueue.add(data, {
    delay: calculateBackoffDelay(data.attemptNumber),
    attempts: 1,
    removeOnComplete: true,
  })
  return job.id.toString()
}

/**
 * Add an analytics collection job
 */
export async function addAnalyticsJob(data: AnalyticsJobData): Promise<string> {
  const job = await analyticsQueue.add(data, {
    repeat: {
      every: 24 * 60 * 60 * 1000, // Every 24 hours
    },
    removeOnComplete: true,
  })
  return job.id.toString()
}

/**
 * Add a repost job for unsold vehicles
 */
export async function addRepostJob(data: RepostJobData, delayMs?: number): Promise<string> {
  const options: any = {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
  }

  if (delayMs) {
    options.delay = delayMs
  }

  const job = await repostQueue.add(data, options)
  return job.id.toString()
}

/**
 * Calculate exponential backoff delay for retries
 */
function calculateBackoffDelay(attemptNumber: number): number {
  // Attempt 1: 5 minutes
  // Attempt 2: 15 minutes
  // Attempt 3: 1 hour
  const delays = [5, 15, 60]
  const minutes = delays[Math.min(attemptNumber - 1, delays.length - 1)]
  return minutes * 60 * 1000
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string, queue: Queue.Queue): Promise<any> {
  const job = await queue.getJob(jobId)
  if (!job) return null

  return {
    id: job.id,
    state: await job.getState(),
    progress: job.progress(),
    attempts: job.attemptsMade,
    failedReason: job.failedReason,
    stacktrace: job.stacktrace,
    data: job.data,
  }
}

/**
 * Cancel a scheduled job
 */
export async function cancelJob(jobId: string, queue: Queue.Queue): Promise<boolean> {
  const job = await queue.getJob(jobId)
  if (!job) return false

  await job.remove()
  return true
}

/**
 * Purge all jobs from a queue (careful!)
 */
export async function purgeQueue(queue: Queue.Queue): Promise<void> {
  await queue.clean(0, 'completed')
  await queue.clean(0, 'failed')
  await queue.clean(0, 'delayed')
  await queue.empty()
}
