/**
 * TikTok integration adapter
 * Posts vehicle videos/photos to TikTok via TikTok for Business API
 */
import https from 'https';
const TIKTOK_API_HOST = 'business-api.tiktok.com';
const TIKTOK_API_VERSION = 'v1.3';
/**
 * Post a vehicle video to TikTok
 * Note: TikTok API primarily focuses on advertising; organic posting requires creator tools
 */
export async function postToTikTok(credentials, post) {
    return new Promise((resolve) => {
        try {
            // TikTok for Business API is primarily for ads, not organic posts
            // For organic posting: use TikTok Creator Portal API (requires approval)
            // Alternative: Use TikTok's video upload flow via their mobile app
            const fullCaption = `${post.caption} ${post.hashtags.map((h) => `#${h}`).join(' ')}`;
            const payload = JSON.stringify({
                advertiser_id: credentials.advertiserId,
                video_url: post.videoUrl,
                caption: fullCaption.substring(0, 2200), // TikTok caption limit
                cover_image_url: post.coverImageUrl,
            });
            const options = {
                hostname: TIKTOK_API_HOST,
                port: 443,
                path: `/${TIKTOK_API_VERSION}/video/upload/`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Token': credentials.accessToken,
                    'Content-Length': Buffer.byteLength(payload),
                },
            };
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.code !== 0) {
                            resolve({
                                postId: '',
                                status: 'error',
                                error: response.message || 'TikTok API error',
                            });
                            return;
                        }
                        const postId = response.data?.video_id || `tt_${Date.now()}`;
                        resolve({
                            postId,
                            status: 'success',
                            url: `https://www.tiktok.com/@dealer/video/${postId}`,
                        });
                    }
                    catch (err) {
                        resolve({
                            postId: '',
                            status: 'error',
                            error: 'Failed to parse TikTok response',
                        });
                    }
                });
            });
            req.on('error', (err) => {
                resolve({
                    postId: '',
                    status: 'error',
                    error: `Network error: ${err.message}`,
                });
            });
            req.write(payload);
            req.end();
        }
        catch (err) {
            resolve({
                postId: '',
                status: 'error',
                error: err instanceof Error ? err.message : 'Unknown error',
            });
        }
    });
}
/**
 * Get TikTok video metrics (views, likes, shares, comments)
 */
export async function getTikTokMetrics(credentials, postId) {
    return new Promise((resolve, reject) => {
        const url = `/${TIKTOK_API_VERSION}/video/info/?advertiser_id=${credentials.advertiserId}&video_id=${postId}`;
        const options = {
            hostname: TIKTOK_API_HOST,
            port: 443,
            path: url,
            method: 'GET',
            headers: {
                'Access-Token': credentials.accessToken,
            },
        };
        https.get(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.code !== 0) {
                        reject(new Error(`TikTok API error: ${json.message}`));
                    }
                    else {
                        const videoData = json.data || {};
                        resolve({
                            views: videoData.play_count || 0,
                            likes: videoData.like_count || 0,
                            shares: videoData.share_count || 0,
                            comments: videoData.comment_count || 0,
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
/**
 * Validate TikTok credentials
 */
export async function validateTikTokCredentials(credentials) {
    return new Promise((resolve) => {
        const url = `/${TIKTOK_API_VERSION}/advertiser/info/?advertiser_ids=[${credentials.advertiserId}]`;
        const options = {
            hostname: TIKTOK_API_HOST,
            port: 443,
            path: url,
            method: 'GET',
            headers: {
                'Access-Token': credentials.accessToken,
            },
        };
        https.get(options, (res) => {
            resolve(res.statusCode === 200);
        });
    });
}
/**
 * Delete a TikTok video
 */
export async function deleteTikTokPost(credentials, postId) {
    return new Promise((resolve) => {
        const payload = JSON.stringify({
            advertiser_id: credentials.advertiserId,
            video_id: postId,
        });
        const options = {
            hostname: TIKTOK_API_HOST,
            port: 443,
            path: `/${TIKTOK_API_VERSION}/video/delete/`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Access-Token': credentials.accessToken,
                'Content-Length': Buffer.byteLength(payload),
            },
        };
        const req = https.request(options, (res) => {
            resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.write(payload);
        req.end();
    });
}
/**
 * Generate TikTok-optimized hashtags for automotive content
 */
export function generateTikTokHashtags(make, model, year, price) {
    const hashtags = [
        'CarTok',
        'CarDeals',
        'CarsForSale',
        'UsedCars',
        make,
        model,
        'AutoDeals',
    ];
    if (price < 15000)
        hashtags.push('AffordableCars', 'BudgetFriendly');
    if (price > 50000)
        hashtags.push('LuxuryCars', 'DreamCar');
    if (year >= new Date().getFullYear() - 2)
        hashtags.push('NewCar', 'LatestModel');
    return hashtags;
}
//# sourceMappingURL=TikTok.js.map