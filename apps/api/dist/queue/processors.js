/**
 * Job Processors - handle actual posting, retries, analytics, reposting
 */
import https from 'https';
import { postToMarketplace } from '../platforms/FacebookMarketplace.js';
import { createPost, updatePostStatus, updatePostMetrics, getPost, getPostsByVehicle } from '../posts.js';
import { getVehicle } from '../vehicles.js';
import { getAIListing, getAIListingsByVehicle } from '../listing.js';
import { shouldRepostVehicle } from './scheduler.js';
import { addRetryJob, addAnalyticsJob, addRepostJob } from './jobQueue.js';
/**
 * Process posting job - post vehicle to marketplace
 */
export async function processPostingJob(job) {
    const { vehicleId, platform, listingId, connectionId, dealerId } = job.data;
    console.log(`[Posting] Starting job ${job.id} for vehicle ${vehicleId} to ${platform}`);
    try {
        const vehicle = getVehicle(vehicleId);
        if (!vehicle)
            throw new Error(`Vehicle ${vehicleId} not found`);
        const listing = await getAIListing(listingId);
        if (!listing)
            throw new Error(`Listing ${listingId} not found`);
        let platformPostId;
        if (platform === 'facebook_marketplace') {
            const { getDecryptedCredentials } = await import('../providers.js');
            const credentials = getDecryptedCredentials(connectionId);
            if (!credentials)
                throw new Error('Failed to decrypt Facebook credentials');
            const result = await postToMarketplace(credentials, {
                title: listing.facebook?.title || listing.baseListingPackage.title,
                description: listing.facebook?.description || listing.baseListingPackage.description,
                price: vehicle.price || 0,
                currency: 'USD',
                imageUrl: vehicle.photos?.[0] || '',
                condition: vehicle.mileage && vehicle.mileage > 50000 ? 'USED' : 'REFURBISHED',
                availability: 'AVAILABLE',
            });
            if (result.status === 'error') {
                throw new Error(result.error);
            }
            platformPostId = result.postId;
        }
        else {
            throw new Error(`Platform ${platform} not yet supported`);
        }
        const post = createPost(vehicleId, dealerId, platform, platformPostId);
        await addAnalyticsJob({
            postId: post.id,
            platform,
            connectionId,
        });
        console.log(`[Posting] ✅ Job ${job.id} complete - posted to ${platform}`);
        return { success: true, postId: post.id, platformPostId };
    }
    catch (error) {
        console.error(`[Posting] ❌ Job ${job.id} failed: ${error.message}`);
        const attemptNumber = job.attemptNumber || 1;
        if (attemptNumber < 3) {
            await addRetryJob({
                originalJobId: job.id,
                vehicleId: job.data.vehicleId,
                platform: job.data.platform,
                connectionId: job.data.connectionId,
                attemptNumber,
                error: error.message,
            });
        }
        throw error;
    }
}
/**
 * Process retry job - retry failed posting with backoff
 */
export async function processRetryJob(job) {
    const { originalJobId, vehicleId, platform, connectionId, attemptNumber } = job.data;
    console.log(`[Retry] Attempt ${attemptNumber} for vehicle ${vehicleId}`);
    try {
        const vehicle = getVehicle(vehicleId);
        if (!vehicle)
            throw new Error(`Vehicle ${vehicleId} not found`);
        const listings = getAIListingsByVehicle(vehicleId);
        const listing = listings.sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())[0];
        if (!listing) {
            throw new Error(`Listing for vehicle ${vehicleId} not found`);
        }
        const { getDecryptedCredentials } = await import('../providers.js');
        const credentials = getDecryptedCredentials(connectionId);
        if (!credentials)
            throw new Error('Failed to decrypt Facebook credentials');
        const result = await postToMarketplace(credentials, {
            title: listing.facebook?.title || listing.baseListingPackage.title,
            description: listing.facebook?.description || listing.baseListingPackage.description,
            price: vehicle.price || 0,
            currency: 'USD',
            imageUrl: vehicle.photos?.[0] || '',
            condition: vehicle.mileage && vehicle.mileage > 50000 ? 'USED' : 'REFURBISHED',
            availability: 'AVAILABLE',
        });
        if (result.status === 'error') {
            throw new Error(result.error);
        }
        console.log(`[Retry] ✅ Attempt ${attemptNumber} succeeded - post ID: ${result.postId}`);
        const post = createPost(vehicleId, vehicle.dealerId, platform, result.postId);
        return { success: true, postId: post.id, attempt: attemptNumber };
    }
    catch (retryError) {
        console.error(`[Retry] ❌ Attempt ${attemptNumber} failed: ${retryError.message}`);
        if (attemptNumber < 3) {
            await addRetryJob({
                originalJobId,
                vehicleId,
                platform,
                connectionId,
                attemptNumber: attemptNumber + 1,
                error: retryError.message,
            });
        }
        throw retryError;
    }
}
/**
 * Process analytics job - fetch metrics from platform
 */
export async function processAnalyticsJob(job) {
    const { postId, platform, connectionId } = job.data;
    console.log(`[Analytics] Fetching metrics for post ${postId}`);
    try {
        const post = getPost(postId);
        if (!post)
            throw new Error(`Post ${postId} not found`);
        let updatedMetrics = {};
        if (platform === 'facebook_marketplace') {
            updatedMetrics = await getMarketplaceAnalytics(post.platformPostId, connectionId);
        }
        await updatePostMetrics(postId, updatedMetrics);
        console.log(`[Analytics] ✅ Updated metrics for post ${postId}:`, updatedMetrics);
        return { success: true, metrics: updatedMetrics };
    }
    catch (error) {
        console.error(`[Analytics] ❌ Job failed: ${error.message}`);
        return { success: false, error: error.message };
    }
}
/**
 * Process repost job - auto-repost unsold vehicle
 */
export async function processRepostJob(job) {
    const { vehicleId, platform, connectionId, dealerId } = job.data;
    console.log(`[Repost] Checking vehicle ${vehicleId} for auto-repost`);
    try {
        const vehicle = getVehicle(vehicleId);
        if (!vehicle)
            throw new Error(`Vehicle ${vehicleId} not found`);
        const posts = getPostsByVehicle(vehicleId);
        const latestPost = posts.sort((a, b) => {
            const aTime = a.postedAt ? a.postedAt.getTime() : 0;
            const bTime = b.postedAt ? b.postedAt.getTime() : 0;
            return bTime - aTime;
        })[0];
        if (!latestPost) {
            console.log(`[Repost] No existing posts for vehicle ${vehicleId}, skipping repost`);
            return { success: false, reason: 'no_existing_posts' };
        }
        const daysListed = latestPost.postedAt
            ? Math.floor((Date.now() - latestPost.postedAt.getTime()) / (24 * 60 * 60 * 1000))
            : 0;
        const shouldRepost = shouldRepostVehicle(latestPost.impressions, latestPost.clicks, daysListed);
        if (!shouldRepost) {
            console.log(`[Repost] Vehicle ${vehicleId} has good engagement, not reposting`);
            return { success: false, reason: 'good_engagement' };
        }
        const listing = await getAIListing(vehicleId);
        if (!listing) {
            throw new Error(`Listing for vehicle ${vehicleId} not found`);
        }
        if (latestPost.id) {
            await updatePostStatus(latestPost.id, 'archived');
            console.log(`[Repost] Archived old post ${latestPost.id}`);
        }
        const { getDecryptedCredentials } = await import('../providers.js');
        const credentials = getDecryptedCredentials(connectionId);
        if (!credentials)
            throw new Error('Failed to decrypt Facebook credentials');
        const result = await postToMarketplace(credentials, {
            title: listing.facebook?.title || listing.baseListingPackage.title,
            description: listing.facebook?.description || listing.baseListingPackage.description,
            price: vehicle.price || 0,
            currency: 'USD',
            imageUrl: vehicle.photos?.[0] || '',
            condition: vehicle.mileage && vehicle.mileage > 50000 ? 'USED' : 'REFURBISHED',
            availability: 'AVAILABLE',
        });
        if (result.status === 'error') {
            throw new Error(result.error);
        }
        const newPost = createPost(vehicleId, dealerId, platform, result.postId);
        console.log(`[Repost] ✅ Vehicle ${vehicleId} reposted (old: ${latestPost.id}, new: ${newPost.id})`);
        await addAnalyticsJob({
            postId: newPost.id,
            platform,
            connectionId,
        });
        await addRepostJob({
            vehicleId,
            platform,
            connectionId,
            dealerId,
            daysWithoutInteraction: 7,
        });
        return { success: true, newPostId: newPost.id, oldPostId: latestPost.id };
    }
    catch (error) {
        console.error(`[Repost] ❌ Job failed: ${error.message}`);
        throw error;
    }
}
/**
 * Fetch metrics from Facebook Marketplace (helper)
 */
async function getMarketplaceAnalytics(platformPostId, accessToken) {
    return new Promise((resolve, reject) => {
        const url = `https://graph.instagram.com/v19.0/${platformPostId}/insights?fields=impressions,clicks&access_token=${accessToken}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.error) {
                        reject(new Error(`FB API error: ${json.error.message}`));
                    }
                    else {
                        const insights = json.data || [];
                        let impressions = 0;
                        let clicks = 0;
                        insights.forEach((insight) => {
                            if (insight.name === 'impressions')
                                impressions = insight.values[0]?.value || 0;
                            if (insight.name === 'clicks')
                                clicks = insight.values[0]?.value || 0;
                        });
                        resolve({
                            impressions,
                            clicks,
                            leads: 0,
                            conversions: 0,
                        });
                    }
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    });
}
//# sourceMappingURL=processors.js.map