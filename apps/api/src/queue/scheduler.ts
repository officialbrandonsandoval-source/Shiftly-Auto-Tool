/**
 * Posting Scheduler - intelligent scheduling for posts
 * Determines optimal times, handles recurring posts, manages unsold vehicle rotation
 */

import { addPostingJob, addRepostJob, PostingJobData, RepostJobData } from './jobQueue.js'
import { getPost } from '../posts.js'
import { getVehicle } from '../vehicles.js'

export interface ScheduleOptions {
  immediatelyPost?: boolean // Post now (at next available time)
  specificTime?: Date // Post at specific time
  recurringDays?: number // Repost every N days
  autoRepostIfUnsold?: boolean // Auto-repost weekly if unsold
  optimalTiming?: boolean // Post at peak engagement hours (analysis-based)
}

/**
 * Schedule a vehicle post
 */
export async function schedulePost(
  vehicleId: string,
  platform: 'facebook_marketplace' | 'craigslist' | 'instagram' | 'tiktok',
  listingId: string,
  connectionId: string,
  dealerId: string,
  options: ScheduleOptions = {}
): Promise<{ jobId: string; scheduledFor: Date }> {
  const vehicle = getVehicle(vehicleId)
  if (!vehicle) throw new Error('Vehicle not found')

  let scheduledFor: Date

  if (options.specificTime) {
    scheduledFor = options.specificTime
  } else if (options.optimalTiming) {
    scheduledFor = getOptimalPostingTime()
  } else if (options.immediatelyPost) {
    scheduledFor = new Date()
  } else {
    // Default: post tomorrow at 9 AM
    scheduledFor = getTomorrowAt(9)
  }

  const delay = Math.max(0, scheduledFor.getTime() - Date.now())

  const jobData: PostingJobData = {
    vehicleId,
    platform,
    listingId,
    connectionId,
    dealerId,
    scheduledFor,
  }

  const jobId = await addPostingJob(jobData, delay)

  return {
    jobId,
    scheduledFor,
  }
}

/**
 * Schedule recurring posts for a vehicle
 * (e.g., repost every 3 days)
 */
export async function scheduleRecurringPosts(
  vehicleId: string,
  platform: 'facebook_marketplace' | 'craigslist',
  listingId: string,
  connectionId: string,
  dealerId: string,
  everyNDays: number
): Promise<{ jobIds: string[]; nextPostTimes: Date[] }> {
  const jobIds: string[] = []
  const nextPostTimes: Date[] = []

  // Schedule next 4 occurrences
  for (let i = 0; i < 4; i++) {
    const nextPostTime = getDateInFuture((i + 1) * everyNDays, 9) // 9 AM
    const delay = nextPostTime.getTime() - Date.now()

    const jobData: PostingJobData = {
      vehicleId,
      platform,
      listingId,
      connectionId,
      dealerId,
      scheduledFor: nextPostTime,
    }

    const jobId = await addPostingJob(jobData, Math.max(0, delay))
    jobIds.push(jobId)
    nextPostTimes.push(nextPostTime)
  }

  return { jobIds, nextPostTimes }
}

/**
 * Schedule auto-repost for unsold vehicles
 * Weekly check: if vehicle hasn't sold and has low engagement, repost
 */
export async function scheduleAutoRepost(
  vehicleId: string,
  platform: 'facebook_marketplace' | 'craigslist',
  connectionId: string,
  dealerId: string
): Promise<string> {
  const repostData: RepostJobData = {
    vehicleId,
    platform,
    connectionId,
    dealerId,
    daysWithoutInteraction: 7, // Default: repost if no activity for 7 days
  }

  // Schedule for 1 week from now
  const weekFromNow = getDateInFuture(7, 9)
  const delay = weekFromNow.getTime() - Date.now()

  const jobId = await addRepostJob(repostData, delay)
  return jobId
}

/**
 * Determine optimal posting time based on engagement patterns
 * For now: Thursday 9 AM (common peak engagement)
 * Future: ML-based per-market optimization
 */
export function getOptimalPostingTime(): Date {
  const now = new Date()
  let nextOptimalTime = getNextThursday(9) // Thursday 9 AM

  // If it's very soon, push to next week
  if (nextOptimalTime.getTime() - now.getTime() < 60 * 60 * 1000) {
    nextOptimalTime = new Date(nextOptimalTime.getTime() + 7 * 24 * 60 * 60 * 1000)
  }

  return nextOptimalTime
}

/**
 * Get next Thursday at specified hour
 */
function getNextThursday(hour: number): Date {
  const now = new Date()
  const daysUntilThursday = (4 - now.getDay() + 7) % 7 || 7 // 4 = Thursday
  const nextThursday = new Date(now)
  nextThursday.setDate(nextThursday.getDate() + daysUntilThursday)
  nextThursday.setHours(hour, 0, 0, 0)
  return nextThursday
}

/**
 * Get tomorrow at specified hour
 */
function getTomorrowAt(hour: number): Date {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(hour, 0, 0, 0)
  return tomorrow
}

/**
 * Get date N days in future at specified hour
 */
function getDateInFuture(days: number, hour: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, 0, 0, 0)
  return date
}

/**
 * Calculate if vehicle should be reposted (low engagement heuristic)
 */
export function shouldRepostVehicle(impressions: number, clicks: number, daysListed: number): boolean {
  // Simple heuristic: if <10 clicks after 7 days, repost
  if (daysListed >= 7) {
    const clicksPerDay = clicks / daysListed
    return clicksPerDay < 1 // Less than 1 click per day
  }

  return false
}

/**
 * Get all dealer's scheduled posts from active jobs
 * (In production, query from DB)
 */
export async function getScheduledPosts(dealerId: string, queue: any): Promise<any[]> {
  const jobs = await queue.getJobs(['delayed'])
  return jobs.filter((job: any) => job.data.dealerId === dealerId)
}
