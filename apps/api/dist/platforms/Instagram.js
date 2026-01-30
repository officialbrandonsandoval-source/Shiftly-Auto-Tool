/**
 * Instagram integration adapter
 * Posts vehicle listings as Instagram posts/stories via Facebook Graph API
 */
import https from 'https';
const INSTAGRAM_API_VERSION = 'v19.0';
const INSTAGRAM_API_HOST = 'graph.facebook.com';
/**
 * Post a vehicle photo to Instagram
 */
export async function postToInstagram(credentials, post) {
    return new Promise((resolve) => {
        try {
            // Step 1: Create media container
            const createContainerPayload = JSON.stringify({
                image_url: post.imageUrl,
                caption: post.caption,
                location_id: post.location?.id,
            });
            const createOptions = {
                hostname: INSTAGRAM_API_HOST,
                port: 443,
                path: `/${INSTAGRAM_API_VERSION}/${credentials.instagramBusinessAccountId}/media?access_token=${encodeURIComponent(credentials.accessToken)}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(createContainerPayload),
                },
            };
            const createReq = https.request(createOptions, (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.error) {
                            resolve({
                                postId: '',
                                status: 'error',
                                error: response.error.message || 'Instagram API error',
                            });
                            return;
                        }
                        const containerId = response.id;
                        // Step 2: Publish the media container
                        const publishOptions = {
                            hostname: INSTAGRAM_API_HOST,
                            port: 443,
                            path: `/${INSTAGRAM_API_VERSION}/${credentials.instagramBusinessAccountId}/media_publish?creation_id=${containerId}&access_token=${encodeURIComponent(credentials.accessToken)}`,
                            method: 'POST',
                        };
                        const publishReq = https.request(publishOptions, (publishRes) => {
                            let publishData = '';
                            publishRes.on('data', (chunk) => (publishData += chunk));
                            publishRes.on('end', () => {
                                try {
                                    const publishResponse = JSON.parse(publishData);
                                    if (publishResponse.error) {
                                        resolve({
                                            postId: '',
                                            status: 'error',
                                            error: publishResponse.error.message || 'Instagram publish error',
                                        });
                                        return;
                                    }
                                    resolve({
                                        postId: publishResponse.id,
                                        status: 'success',
                                        url: `https://www.instagram.com/p/${publishResponse.id}/`,
                                    });
                                }
                                catch (err) {
                                    resolve({
                                        postId: '',
                                        status: 'error',
                                        error: 'Failed to parse Instagram publish response',
                                    });
                                }
                            });
                        });
                        publishReq.on('error', (err) => {
                            resolve({
                                postId: '',
                                status: 'error',
                                error: `Instagram publish network error: ${err.message}`,
                            });
                        });
                        publishReq.end();
                    }
                    catch (err) {
                        resolve({
                            postId: '',
                            status: 'error',
                            error: 'Failed to parse Instagram container response',
                        });
                    }
                });
            });
            createReq.on('error', (err) => {
                resolve({
                    postId: '',
                    status: 'error',
                    error: `Network error: ${err.message}`,
                });
            });
            createReq.write(createContainerPayload);
            createReq.end();
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
 * Get Instagram post metrics (likes, comments, reach)
 */
export async function getInstagramMetrics(credentials, postId) {
    return new Promise((resolve, reject) => {
        const url = `/${INSTAGRAM_API_VERSION}/${postId}/insights?metric=likes,comments,reach,impressions&access_token=${encodeURIComponent(credentials.accessToken)}`;
        const options = {
            hostname: INSTAGRAM_API_HOST,
            port: 443,
            path: url,
            method: 'GET',
        };
        https.get(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.error) {
                        reject(new Error(`Instagram API error: ${json.error.message}`));
                    }
                    else {
                        const insights = json.data || [];
                        let likes = 0;
                        let comments = 0;
                        let reach = 0;
                        let impressions = 0;
                        insights.forEach((insight) => {
                            if (insight.name === 'likes')
                                likes = insight.values[0]?.value || 0;
                            if (insight.name === 'comments')
                                comments = insight.values[0]?.value || 0;
                            if (insight.name === 'reach')
                                reach = insight.values[0]?.value || 0;
                            if (insight.name === 'impressions')
                                impressions = insight.values[0]?.value || 0;
                        });
                        resolve({ likes, comments, reach, impressions });
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
 * Validate Instagram credentials
 */
export async function validateInstagramCredentials(credentials) {
    return new Promise((resolve) => {
        const url = `/${INSTAGRAM_API_VERSION}/${credentials.instagramBusinessAccountId}?fields=id,username&access_token=${encodeURIComponent(credentials.accessToken)}`;
        const options = {
            hostname: INSTAGRAM_API_HOST,
            port: 443,
            path: url,
            method: 'GET',
        };
        https.get(options, (res) => {
            resolve(res.statusCode === 200);
        });
    });
}
/**
 * Delete an Instagram post
 */
export async function deleteInstagramPost(credentials, postId) {
    return new Promise((resolve) => {
        const url = `/${INSTAGRAM_API_VERSION}/${postId}?access_token=${encodeURIComponent(credentials.accessToken)}`;
        const options = {
            hostname: INSTAGRAM_API_HOST,
            port: 443,
            path: url,
            method: 'DELETE',
        };
        const req = https.request(options, (res) => {
            resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.end();
    });
}
//# sourceMappingURL=Instagram.js.map