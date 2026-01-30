import crypto from 'crypto'

/**
 * Post represents a vehicle listing posted to a platform (Facebook Marketplace, etc.)
 * Tracks: which vehicle, which platform, post ID, status, performance metrics
 */

export interface Post {
  id: string
  vehicleId: string
  dealerId: string
  platform: 'facebook_marketplace' | 'craigslist' | 'instagram' | 'tiktok' // Extensible
  platformPostId: string // The actual post ID from the platform
  status: 'posted' | 'archived' | 'deleted' | 'failed'
  createdAt: Date
  postedAt: Date | null
  archivedAt: Date | null
  deletedAt: Date | null
  // Metrics (updated daily from platform APIs)
  impressions: number
  clicks: number
  leads: number
  conversions: number
  lastMetricsUpdateAt: Date | null
  // Error tracking
  errorMessage: string | null
}

// In-memory store (production: use database)
const posts: Map<string, Post> = new Map()

/**
 * Creates a new post record
 */
export function createPost(
  vehicleId: string,
  dealerId: string,
  platform: Post['platform'],
  platformPostId: string
): Post {
  const id = crypto.randomUUID()

  const post: Post = {
    id,
    vehicleId,
    dealerId,
    platform,
    platformPostId,
    status: 'posted',
    createdAt: new Date(),
    postedAt: new Date(),
    archivedAt: null,
    deletedAt: null,
    impressions: 0,
    clicks: 0,
    leads: 0,
    conversions: 0,
    lastMetricsUpdateAt: null,
    errorMessage: null,
  }

  posts.set(id, post)
  return post
}

/**
 * Gets a post by ID
 */
export function getPost(postId: string): Post | null {
  return posts.get(postId) || null
}

/**
 * Gets all posts for a vehicle
 */
export function getPostsByVehicle(vehicleId: string): Post[] {
  return Array.from(posts.values()).filter((p) => p.vehicleId === vehicleId)
}

/**
 * Gets all posts for a dealer
 */
export function getPostsByDealer(dealerId: string): Post[] {
  return Array.from(posts.values()).filter((p) => p.dealerId === dealerId)
}

/**
 * Gets all posts for a dealer on a specific platform
 */
export function getPostsByDealerAndPlatform(dealerId: string, platform: Post['platform']): Post[] {
  return Array.from(posts.values()).filter((p) => p.dealerId === dealerId && p.platform === platform)
}

/**
 * Updates post status (e.g., mark as archived after sale)
 */
export function updatePostStatus(postId: string, status: Post['status']): boolean {
  const post = posts.get(postId)
  if (!post) return false

  post.status = status

  if (status === 'archived') {
    post.archivedAt = new Date()
  } else if (status === 'deleted') {
    post.deletedAt = new Date()
  }

  return true
}

/**
 * Updates post metrics (called daily from analytics collector)
 */
export function updatePostMetrics(
  postId: string,
  metrics: {
    impressions: number
    clicks: number
    leads: number
    conversions: number
  }
): boolean {
  const post = posts.get(postId)
  if (!post) return false

  post.impressions = metrics.impressions
  post.clicks = metrics.clicks
  post.leads = metrics.leads
  post.conversions = metrics.conversions
  post.lastMetricsUpdateAt = new Date()

  return true
}

/**
 * Records a posting failure
 */
export function recordPostError(postId: string, errorMessage: string): boolean {
  const post = posts.get(postId)
  if (!post) return false

  post.status = 'failed'
  post.errorMessage = errorMessage

  return true
}

/**
 * Deletes a post record
 */
export function deletePost(postId: string): boolean {
  return posts.delete(postId)
}

/**
 * Gets all active (non-deleted, non-archived) posts for a dealer
 */
export function getActivePosts(dealerId: string): Post[] {
  return Array.from(posts.values()).filter(
    (p) => p.dealerId === dealerId && p.status !== 'deleted' && p.status !== 'archived'
  )
}
