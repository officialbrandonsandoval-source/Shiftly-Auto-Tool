import https from 'https';
/**
 * Facebook Marketplace integration
 * Posts vehicle listings directly to dealer's Facebook Marketplace
 * Requires: OAuth access token with marketplace_management scope
 */
const FB_API_VERSION = 'v19.0';
const FB_API_HOST = 'graph.facebook.com';
/**
 * Post a vehicle listing to Facebook Marketplace
 */
export async function postToMarketplace(credentials, listing) {
    return new Promise((resolve, reject) => {
        try {
            const pageId = credentials.pageId || credentials.userId;
            const endpoint = `/${FB_API_VERSION}/${pageId}/marketplace_product_feeds`;
            // Build marketplace product feed payload
            const payload = JSON.stringify({
                title: listing.title,
                description: listing.description,
                price: listing.price,
                currency: listing.currency,
                image_hash: '', // Will be generated from imageUrl
                condition: listing.condition,
                availability: listing.availability,
                category_enum: 'VEHICLE', // Marketplace category for vehicles
            });
            const options = {
                hostname: FB_API_HOST,
                port: 443,
                path: `${endpoint}?access_token=${encodeURIComponent(credentials.accessToken)}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                },
            };
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (res.statusCode === 200 || res.statusCode === 201) {
                            resolve({
                                postId: response.id,
                                status: 'success',
                                url: `https://www.facebook.com/marketplace/item/${response.id}`,
                            });
                        }
                        else {
                            resolve({
                                postId: '',
                                status: 'error',
                                error: response.error?.message || 'Unknown Facebook API error',
                            });
                        }
                    }
                    catch (err) {
                        resolve({
                            postId: '',
                            status: 'error',
                            error: 'Failed to parse Facebook response',
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
 * Get metrics for a posted listing (impressions, clicks, etc.)
 */
export async function getMarketplaceMetrics(credentials, postId) {
    return new Promise((resolve, reject) => {
        try {
            const endpoint = `/${FB_API_VERSION}/${postId}/insights?metrics=impressions,clicks`;
            const options = {
                hostname: FB_API_HOST,
                port: 443,
                path: `${endpoint}&access_token=${encodeURIComponent(credentials.accessToken)}`,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve(response);
                    }
                    catch (err) {
                        reject(new Error('Failed to parse Facebook metrics response'));
                    }
                });
            });
            req.on('error', reject);
            req.end();
        }
        catch (err) {
            reject(err);
        }
    });
}
/**
 * Delete a marketplace listing
 */
export async function deleteMarketplacePost(credentials, postId) {
    return new Promise((resolve) => {
        try {
            const endpoint = `/${FB_API_VERSION}/${postId}`;
            const options = {
                hostname: FB_API_HOST,
                port: 443,
                path: `${endpoint}?access_token=${encodeURIComponent(credentials.accessToken)}`,
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            const req = https.request(options, (res) => {
                resolve(res.statusCode === 200);
            });
            req.on('error', () => {
                resolve(false);
            });
            req.end();
        }
        catch (err) {
            resolve(false);
        }
    });
}
/**
 * Validate access token is still valid
 */
export async function validateAccessToken(credentials) {
    return new Promise((resolve) => {
        try {
            const endpoint = `/${FB_API_VERSION}/me`;
            const options = {
                hostname: FB_API_HOST,
                port: 443,
                path: `${endpoint}?access_token=${encodeURIComponent(credentials.accessToken)}`,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            const req = https.request(options, (res) => {
                resolve(res.statusCode === 200);
            });
            req.on('error', () => {
                resolve(false);
            });
            req.end();
        }
        catch (err) {
            resolve(false);
        }
    });
}
//# sourceMappingURL=FacebookMarketplace.js.map