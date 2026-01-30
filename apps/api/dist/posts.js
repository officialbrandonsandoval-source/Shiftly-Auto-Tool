import crypto from 'crypto';
// In-memory store (production: use database)
const posts = new Map();
/**
 * Creates a new post record
 */
export function createPost(vehicleId, dealerId, platform, platformPostId) {
    const id = crypto.randomUUID();
    const post = {
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
    };
    posts.set(id, post);
    return post;
}
/**
 * Gets a post by ID
 */
export function getPost(postId) {
    return posts.get(postId) || null;
}
/**
 * Gets all posts for a vehicle
 */
export function getPostsByVehicle(vehicleId) {
    return Array.from(posts.values()).filter((p) => p.vehicleId === vehicleId);
}
/**
 * Gets all posts for a dealer
 */
export function getPostsByDealer(dealerId) {
    return Array.from(posts.values()).filter((p) => p.dealerId === dealerId);
}
/**
 * Gets all posts for a dealer on a specific platform
 */
export function getPostsByDealerAndPlatform(dealerId, platform) {
    return Array.from(posts.values()).filter((p) => p.dealerId === dealerId && p.platform === platform);
}
/**
 * Updates post status (e.g., mark as archived after sale)
 */
export function updatePostStatus(postId, status) {
    const post = posts.get(postId);
    if (!post)
        return false;
    post.status = status;
    if (status === 'archived') {
        post.archivedAt = new Date();
    }
    else if (status === 'deleted') {
        post.deletedAt = new Date();
    }
    return true;
}
/**
 * Updates post metrics (called daily from analytics collector)
 */
export function updatePostMetrics(postId, metrics) {
    const post = posts.get(postId);
    if (!post)
        return false;
    post.impressions = metrics.impressions;
    post.clicks = metrics.clicks;
    post.leads = metrics.leads;
    post.conversions = metrics.conversions;
    post.lastMetricsUpdateAt = new Date();
    return true;
}
/**
 * Records a posting failure
 */
export function recordPostError(postId, errorMessage) {
    const post = posts.get(postId);
    if (!post)
        return false;
    post.status = 'failed';
    post.errorMessage = errorMessage;
    return true;
}
/**
 * Deletes a post record
 */
export function deletePost(postId) {
    return posts.delete(postId);
}
/**
 * Gets all active (non-deleted, non-archived) posts for a dealer
 */
export function getActivePosts(dealerId) {
    return Array.from(posts.values()).filter((p) => p.dealerId === dealerId && p.status !== 'deleted' && p.status !== 'archived');
}
//# sourceMappingURL=posts.js.map