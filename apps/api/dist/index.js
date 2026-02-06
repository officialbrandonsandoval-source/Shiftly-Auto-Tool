import express from 'express';
import cors from 'cors';
import { generateToken, authMiddleware, apiKeyMiddleware } from './auth.js';
import authRoutes from './auth/authRoutes.js';
import { createApiKey, listApiKeys, revokeApiKey, getApiKey } from './apiKeys.js';
import { createProviderConnection, getProviderConnection, listProviderConnections, revokeProviderConnection, } from './providers.js';
import { listVehicles, getVehicle, countVehicles } from './vehicles.js';
import { syncProviderConnection, getAdapter } from './sync.js';
import { generateListingPackage, generateAIListingVariations, getAIListing, getAIListingsByVehicle } from './listing.js';
import { correlationIdMiddleware, getCorrelationId } from './correlation.js';
import { getSyncLogsByConnection, getSyncLogsByDealer, getLastSyncStatus } from './syncLogs.js';
import { seedTestVehicles } from './seedData.js';
import { createPost, getPost, getPostsByVehicle, getPostsByDealer, updatePostStatus, recordPostError, getActivePosts, } from './posts.js';
import { postToMarketplace, validateAccessToken } from './platforms/FacebookMarketplace.js';
import { schedulePost, scheduleRecurringPosts, scheduleAutoRepost } from './queue/scheduler.js';
import { postingQueue, retryQueue, analyticsQueue, repostQueue } from './queue/jobQueue.js';
import { generateDealerAnalytics, getCachedAnalytics, exportAnalyticsCSV } from './analytics.js';
const app = express();
// Render injects PORT. Default only for local dev.
const PORT = Number(process.env.PORT) || 3001;
const HOST = '0.0.0.0';
// Middleware
app.use(cors());
app.use(express.json());
app.use(correlationIdMiddleware);
// Health check endpoint (Render uses this)
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Root endpoint
app.get('/', (_req, res) => {
    res.json({ message: 'PONS Auto API', version: '0.1.0' });
});
// V2: Multi-tenant authentication routes (new)
app.use('/auth/v2', authRoutes);
// V1: Legacy auth routes (keep for backward compatibility)
// Auth routes
app.post('/auth/login', (req, res) => {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ error: 'Email required' });
    const token = generateToken(email);
    res.json({ token, user: { email } });
});
// Protected route: get current user
app.get('/me', authMiddleware, (req, res) => {
    res.json({ user: { id: req.userId } });
});
// API Keys routes (protected)
app.post('/api-keys', authMiddleware, (req, res) => {
    const { name } = req.body;
    if (!name)
        return res.status(400).json({ error: 'Name required' });
    const { id, key, keyHash } = createApiKey(name);
    res.status(201).json({
        id,
        name,
        key, // plaintext returned once
        keyHash,
        createdAt: new Date(),
        revokedAt: null,
    });
});
app.get('/api-keys', authMiddleware, (_req, res) => {
    const keys = listApiKeys();
    res.json({
        keys: keys.map((k) => ({
            id: k.id,
            name: k.name,
            createdAt: k.createdAt,
            revokedAt: k.revokedAt,
        })),
    });
});
app.delete('/api-keys/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const success = revokeApiKey(id);
    if (!success)
        return res.status(404).json({ error: 'API key not found' });
    const key = getApiKey(id);
    res.json({ message: 'API key revoked', key });
});
// Provider Connection routes (protected)
app.post('/provider-connections', authMiddleware, (req, res) => {
    const { dealerId, providerType, credentials } = req.body;
    if (!dealerId || !providerType || !credentials) {
        return res.status(400).json({ error: 'dealerId, providerType, and credentials required' });
    }
    try {
        const connection = createProviderConnection(dealerId, providerType, credentials);
        res.status(201).json({
            id: connection.id,
            dealerId: connection.dealerId,
            providerType: connection.providerType,
            createdAt: connection.createdAt,
            lastSyncedAt: connection.lastSyncedAt,
            lastSyncStatus: connection.lastSyncStatus,
            lastSyncError: connection.lastSyncError,
        });
    }
    catch (err) {
        console.error('[SECURITY] Failed to create provider connection:', err);
        res.status(500).json({ error: 'Failed to create provider connection' });
    }
});
app.get('/provider-connections', authMiddleware, (req, res) => {
    const dealerId = req.userId || 'default-dealer';
    try {
        const connections = listProviderConnections(dealerId);
        res.json({ connections });
    }
    catch (err) {
        console.error('[SECURITY] Failed to list provider connections:', err);
        res.status(500).json({ error: 'Failed to list provider connections' });
    }
});
app.get('/provider-connections/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    try {
        const connection = getProviderConnection(id);
        if (!connection)
            return res.status(404).json({ error: 'Provider connection not found' });
        res.json(connection);
    }
    catch (err) {
        console.error('[SECURITY] Failed to retrieve provider connection:', err);
        res.status(500).json({ error: 'Failed to retrieve provider connection' });
    }
});
app.delete('/provider-connections/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    try {
        const success = revokeProviderConnection(id);
        if (!success)
            return res.status(404).json({ error: 'Provider connection not found' });
        res.json({ message: 'Provider connection revoked' });
    }
    catch (err) {
        console.error('[SECURITY] Failed to revoke provider connection:', err);
        res.status(500).json({ error: 'Failed to revoke provider connection' });
    }
});
// POST /sync/:connectionId: Trigger sync
app.post('/sync/:connectionId', authMiddleware, async (req, res) => {
    const { connectionId } = req.params;
    const correlationId = getCorrelationId(req);
    try {
        const connection = getProviderConnection(connectionId);
        if (!connection)
            return res.status(404).json({ error: 'Provider connection not found' });
        let adapter;
        try {
            adapter = getAdapter(connection.providerType);
        }
        catch {
            return res.status(400).json({ error: `Unsupported provider type: ${connection.providerType}` });
        }
        const result = await syncProviderConnection(connectionId, connection.dealerId, adapter, correlationId);
        res.json({
            ...result,
            connectionId,
            providerType: connection.providerType,
            correlationId,
        });
    }
    catch (err) {
        console.error('[Sync] Failed to trigger sync:', err);
        res.status(500).json({ error: 'Failed to trigger sync' });
    }
});
// GET /vehicles: List vehicles (requires JWT or API key)
app.get('/vehicles', (req, res, next) => {
    const hasApiKey = req.headers['x-api-key'];
    const hasAuth = req.headers.authorization?.startsWith('Bearer ');
    if (hasApiKey)
        return apiKeyMiddleware(req, res, next);
    if (hasAuth)
        return authMiddleware(req, res, next);
    return res.status(401).json({ error: 'Authentication required' });
}, (req, res) => {
    try {
        const dealerId = req.query.dealerId;
        const query = req.query.query;
        const status = req.query.status;
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        const offset = req.query.offset ? parseInt(req.query.offset) : 0;
        const vehicles = listVehicles({ dealerId, query, status, limit, offset });
        const total = countVehicles({ dealerId, query, status });
        res.json({
            vehicles,
            pagination: { limit, offset, total },
        });
    }
    catch (err) {
        console.error('[Vehicles] Failed to list vehicles:', err);
        res.status(500).json({ error: 'Failed to list vehicles' });
    }
});
app.get('/vehicles/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    try {
        const vehicle = getVehicle(id);
        if (!vehicle)
            return res.status(404).json({ error: 'Vehicle not found' });
        res.json(vehicle);
    }
    catch (err) {
        console.error('[Vehicles] Failed to get vehicle:', err);
        res.status(500).json({ error: 'Failed to get vehicle' });
    }
});
app.get('/listing/:vehicleId', authMiddleware, (req, res) => {
    const { vehicleId } = req.params;
    try {
        const vehicle = getVehicle(vehicleId);
        if (!vehicle)
            return res.status(404).json({ error: 'Vehicle not found' });
        const listing = generateListingPackage(vehicle);
        res.json(listing);
    }
    catch (err) {
        console.error('[Listing] Failed to generate listing:', err);
        res.status(500).json({ error: 'Failed to generate listing' });
    }
});
// SLICE 13: AI Listing Generation
app.post('/listings/:vehicleId/generate', authMiddleware, async (req, res) => {
    const { vehicleId } = req.params;
    try {
        const vehicle = getVehicle(vehicleId);
        if (!vehicle)
            return res.status(404).json({ error: 'Vehicle not found' });
        res.setHeader('Content-Type', 'application/json');
        res.write('{"status":"generating"');
        const aiListing = await generateAIListingVariations(vehicle);
        res.write(`,"listingId":"${aiListing.id}"`);
        res.write(`,"facebook":${JSON.stringify(aiListing.facebook)}`);
        res.write(`,"craigslist":${JSON.stringify(aiListing.craigslist)}`);
        res.write(`,"keywords":${JSON.stringify(aiListing.keywords)}`);
        res.write(`,"photoRanking":${JSON.stringify(aiListing.photoRanking)}`);
        res.write(`,"generatedAt":"${aiListing.generatedAt.toISOString()}"`);
        res.write('}');
        res.end();
    }
    catch (err) {
        console.error('[AI Listing] Failed to generate:', err);
        res.status(500).json({ error: 'Failed to generate AI listing' });
    }
});
// GET /listings/:listingId: Retrieve generated AI listing
app.get('/listings/:listingId', authMiddleware, (req, res) => {
    const { listingId } = req.params;
    try {
        const aiListing = getAIListing(listingId);
        if (!aiListing)
            return res.status(404).json({ error: 'AI listing not found' });
        res.json({
            id: aiListing.id,
            vehicleId: aiListing.vehicleId,
            facebook: aiListing.facebook,
            craigslist: aiListing.craigslist,
            keywords: aiListing.keywords,
            photoRanking: aiListing.photoRanking,
            generatedAt: aiListing.generatedAt,
        });
    }
    catch (err) {
        console.error('[AI Listing] Failed to retrieve:', err);
        res.status(500).json({ error: 'Failed to retrieve AI listing' });
    }
});
// GET /vehicles/:vehicleId/listings: Get all AI variations for a vehicle
app.get('/vehicles/:vehicleId/listings', authMiddleware, (req, res) => {
    const { vehicleId } = req.params;
    try {
        const vehicle = getVehicle(vehicleId);
        if (!vehicle)
            return res.status(404).json({ error: 'Vehicle not found' });
        const aiListings = getAIListingsByVehicle(vehicleId);
        res.json({
            vehicleId,
            totalVariations: aiListings.length,
            listings: aiListings.map((l) => ({
                id: l.id,
                facebook: l.facebook,
                craigslist: l.craigslist,
                keywords: l.keywords,
                generatedAt: l.generatedAt,
            })),
        });
    }
    catch (err) {
        console.error('[AI Listing] Failed to list variations:', err);
        res.status(500).json({ error: 'Failed to list AI variations' });
    }
});
// Diagnostics
app.get('/diagnostics/sync-logs/:connectionId', authMiddleware, (req, res) => {
    const { connectionId } = req.params;
    try {
        const connection = getProviderConnection(connectionId);
        if (!connection)
            return res.status(404).json({ error: 'Provider connection not found' });
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        const logs = getSyncLogsByConnection(connectionId, limit);
        res.json({
            connectionId,
            providerType: connection.providerType,
            totalLogs: logs.length,
            logs,
        });
    }
    catch (err) {
        console.error('[Diagnostics] Failed to retrieve sync logs:', err);
        res.status(500).json({ error: 'Failed to retrieve sync logs' });
    }
});
app.get('/diagnostics/sync-logs/dealer/:dealerId', authMiddleware, (req, res) => {
    const { dealerId } = req.params;
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;
        const logs = getSyncLogsByDealer(dealerId, limit);
        res.json({ dealerId, totalLogs: logs.length, logs });
    }
    catch (err) {
        console.error('[Diagnostics] Failed to retrieve dealer sync logs:', err);
        res.status(500).json({ error: 'Failed to retrieve sync logs' });
    }
});
app.get('/diagnostics/sync-status/:connectionId', authMiddleware, (req, res) => {
    const { connectionId } = req.params;
    try {
        const connection = getProviderConnection(connectionId);
        if (!connection)
            return res.status(404).json({ error: 'Provider connection not found' });
        const lastSync = getLastSyncStatus(connectionId);
        res.json({
            connectionId,
            providerType: connection.providerType,
            lastSync: lastSync || { message: 'No syncs yet' },
            connectionStatus: {
                lastSyncedAt: connection.lastSyncedAt,
                lastSyncStatus: connection.lastSyncStatus,
                lastSyncError: connection.lastSyncError,
            },
        });
    }
    catch (err) {
        console.error('[Diagnostics] Failed to retrieve sync status:', err);
        res.status(500).json({ error: 'Failed to retrieve sync status' });
    }
});
// Start server (bind to 0.0.0.0 for Render)
app.listen(PORT, HOST, () => {
    console.log(`✓ Server running on http://${HOST}:${PORT}`);
    console.log(`✓ Health check: http://${HOST}:${PORT}/health`);
    // Seed test data in development
    if (process.env.NODE_ENV !== 'production') {
        seedTestVehicles();
    }
});
// ============= SLICE 12: FACEBOOK MARKETPLACE INTEGRATION =============
const FB_APP_ID = process.env.FB_APP_ID || 'dev-fb-app-id';
const FB_APP_SECRET = process.env.FB_APP_SECRET || 'dev-fb-app-secret';
const FB_REDIRECT_URI = process.env.FB_REDIRECT_URI || 'http://localhost:3001/auth/marketplace/facebook/callback';
// OAuth callback handler for Facebook (Slice 12)
app.get('/auth/marketplace/facebook', (_req, res) => {
    // Redirect to Facebook OAuth consent screen
    const params = new URLSearchParams({
        client_id: FB_APP_ID,
        redirect_uri: FB_REDIRECT_URI,
        scope: 'marketplace_management,pages_manage_metadata,pages_read_engagement',
        state: 'state_value_for_csrf_protection',
    });
    res.redirect(`https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`);
});
// Facebook OAuth callback (Slice 12)
app.get('/auth/marketplace/facebook/callback', async (req, res) => {
    const { code, state } = req.query;
    if (!code || !state) {
        return res.status(400).json({ error: 'Missing code or state' });
    }
    try {
        // Exchange code for access token
        const tokenResponse = await fetch('https://graph.facebook.com/v19.0/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: FB_APP_ID,
                client_secret: FB_APP_SECRET,
                redirect_uri: FB_REDIRECT_URI,
                code: code,
            }),
        });
        const tokenData = (await tokenResponse.json());
        if (!tokenData.access_token) {
            return res.status(400).json({ error: 'Failed to obtain access token' });
        }
        // Fetch user info
        const meResponse = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${encodeURIComponent(tokenData.access_token)}`);
        const meData = (await meResponse.json());
        // Create platform credential (stored encrypted)
        const fbCredentials = {
            accessToken: tokenData.access_token,
            userId: meData.id,
            pageId: meData.id, // Default to user ID; dealer can override
        };
        const connection = createProviderConnection('facebook-marketplace', 'facebook_marketplace', fbCredentials);
        res.json({
            message: 'Facebook Marketplace connected',
            connectionId: connection.id,
            userId: meData.id,
            // Redirect to mobile app or dashboard
            redirectUrl: `shiftly://marketplace/connected?connectionId=${connection.id}`,
        });
    }
    catch (err) {
        console.error('[OAuth] Facebook callback error:', err);
        res.status(500).json({ error: 'Failed to complete OAuth flow' });
    }
});
// POST /posts/:vehicleId/marketplace: Post to Facebook Marketplace (Slice 12)
app.post('/posts/:vehicleId/marketplace', authMiddleware, async (req, res) => {
    const { vehicleId } = req.params;
    const { connectionId } = req.body;
    if (!connectionId) {
        return res.status(400).json({ error: 'connectionId required' });
    }
    try {
        const vehicle = getVehicle(vehicleId);
        if (!vehicle)
            return res.status(404).json({ error: 'Vehicle not found' });
        // Get Facebook credentials (stored encrypted)
        const fbConnection = getProviderConnection(connectionId);
        if (!fbConnection)
            return res.status(404).json({ error: 'Facebook connection not found' });
        // Get decrypted credentials
        const { getDecryptedCredentials } = await import('./providers.js');
        const fbCredentials = getDecryptedCredentials(connectionId);
        if (!fbCredentials) {
            recordPostError('temp-id', 'Failed to decrypt Facebook credentials');
            return res.status(500).json({ error: 'Failed to decrypt Facebook credentials' });
        }
        // Validate token is still valid
        const isValid = await validateAccessToken(fbCredentials);
        if (!isValid) {
            return res.status(401).json({ error: 'Facebook access token expired. Please reconnect.' });
        }
        // Generate listing
        const listing = generateListingPackage(vehicle);
        // Post to Facebook Marketplace
        const result = await postToMarketplace(fbCredentials, {
            title: listing.title,
            description: listing.description,
            price: vehicle.price || 0,
            currency: 'USD',
            imageUrl: vehicle.photos?.[0] || '',
            condition: vehicle.mileage && vehicle.mileage > 50000 ? 'USED' : 'REFURBISHED',
            availability: 'AVAILABLE',
        });
        if (result.status === 'error') {
            return res.status(400).json({
                error: result.error,
                vehicleId,
                connectionId,
            });
        }
        // Create post record
        const post = createPost(vehicleId, req.userId || 'default-dealer', 'facebook_marketplace', result.postId);
        res.status(201).json({
            postId: post.id,
            platformPostId: result.postId,
            vehicleId,
            platform: 'facebook_marketplace',
            status: 'posted',
            url: result.url,
            createdAt: post.createdAt,
        });
    }
    catch (err) {
        console.error('[Posts] Failed to post to marketplace:', err);
        res.status(500).json({ error: 'Failed to post to Facebook Marketplace' });
    }
});
// GET /posts/:vehicleId: Get all posts for a vehicle (Slice 12)
app.get('/posts/:vehicleId', authMiddleware, (req, res) => {
    const { vehicleId } = req.params;
    try {
        const posts = getPostsByVehicle(vehicleId);
        if (posts.length === 0) {
            return res.json({
                vehicleId,
                posts: [],
                message: 'No posts for this vehicle',
            });
        }
        res.json({
            vehicleId,
            posts: posts.map((p) => ({
                id: p.id,
                platform: p.platform,
                platformPostId: p.platformPostId,
                status: p.status,
                postedAt: p.postedAt,
                impressions: p.impressions,
                clicks: p.clicks,
                leads: p.leads,
            })),
        });
    }
    catch (err) {
        console.error('[Posts] Failed to get posts:', err);
        res.status(500).json({ error: 'Failed to get posts' });
    }
});
// DELETE /posts/:postId: Delete a post (Slice 12)
app.delete('/posts/:postId', authMiddleware, (req, res) => {
    const { postId } = req.params;
    try {
        const post = getPost(postId);
        if (!post)
            return res.status(404).json({ error: 'Post not found' });
        updatePostStatus(postId, 'deleted');
        res.json({
            message: 'Post deleted',
            postId,
            platform: post.platform,
        });
    }
    catch (err) {
        console.error('[Posts] Failed to delete post:', err);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});
// GET /dealer/posts: Get all posts for a dealer (Slice 12)
app.get('/dealer/posts', authMiddleware, (req, res) => {
    const dealerId = req.userId || 'default-dealer';
    try {
        const posts = getPostsByDealer(dealerId);
        const activeCount = getActivePosts(dealerId).length;
        res.json({
            dealerId,
            totalPosts: posts.length,
            activePosts: activeCount,
            posts: posts.map((p) => ({
                id: p.id,
                vehicleId: p.vehicleId,
                platform: p.platform,
                status: p.status,
                postedAt: p.postedAt,
                impressions: p.impressions,
                clicks: p.clicks,
                leads: p.leads,
            })),
        });
    }
    catch (err) {
        console.error('[Posts] Failed to get dealer posts:', err);
        res.status(500).json({ error: 'Failed to get posts' });
    }
});
// ===== SLICE 14: SCHEDULER ENDPOINTS =====
// POST /scheduler/post: Schedule a vehicle post
app.post('/scheduler/post', authMiddleware, async (req, res) => {
    const dealerId = req.userId || 'default-dealer';
    const { vehicleId, platform, listingId, connectionId, options } = req.body;
    try {
        if (!vehicleId || !platform || !listingId || !connectionId) {
            return res.status(400).json({
                error: 'Missing required fields: vehicleId, platform, listingId, connectionId',
            });
        }
        const result = await schedulePost(vehicleId, platform, listingId, connectionId, dealerId, options);
        res.json({
            success: true,
            jobId: result.jobId,
            scheduledFor: result.scheduledFor,
        });
    }
    catch (err) {
        console.error('[Scheduler] Failed to schedule post:', err);
        res.status(500).json({ error: err.message || 'Failed to schedule post' });
    }
});
// POST /scheduler/recurring: Schedule recurring posts
app.post('/scheduler/recurring', authMiddleware, async (req, res) => {
    const dealerId = req.userId || 'default-dealer';
    const { vehicleId, platform, listingId, connectionId, everyNDays } = req.body;
    try {
        if (!vehicleId || !platform || !listingId || !connectionId || !everyNDays) {
            return res.status(400).json({
                error: 'Missing required fields: vehicleId, platform, listingId, connectionId, everyNDays',
            });
        }
        const result = await scheduleRecurringPosts(vehicleId, platform, listingId, connectionId, dealerId, everyNDays);
        res.json({
            success: true,
            jobIds: result.jobIds,
            nextPostTimes: result.nextPostTimes,
        });
    }
    catch (err) {
        console.error('[Scheduler] Failed to schedule recurring posts:', err);
        res.status(500).json({ error: err.message || 'Failed to schedule recurring posts' });
    }
});
// POST /scheduler/auto-repost: Enable auto-reposting for unsold vehicle
app.post('/scheduler/auto-repost', authMiddleware, async (req, res) => {
    const dealerId = req.userId || 'default-dealer';
    const { vehicleId, platform, connectionId } = req.body;
    try {
        if (!vehicleId || !platform || !connectionId) {
            return res.status(400).json({
                error: 'Missing required fields: vehicleId, platform, connectionId',
            });
        }
        const jobId = await scheduleAutoRepost(vehicleId, platform, connectionId, dealerId);
        res.json({
            success: true,
            jobId,
            message: 'Auto-repost enabled for unsold vehicle',
        });
    }
    catch (err) {
        console.error('[Scheduler] Failed to enable auto-repost:', err);
        res.status(500).json({ error: err.message || 'Failed to enable auto-repost' });
    }
});
// GET /scheduler/jobs/:jobId: Get job status
app.get('/scheduler/jobs/:jobId', authMiddleware, async (req, res) => {
    const { jobId } = req.params;
    try {
        // Check all queues for job
        let job = await postingQueue.getJob(jobId);
        if (!job)
            job = await retryQueue.getJob(jobId);
        if (!job)
            job = await analyticsQueue.getJob(jobId);
        if (!job)
            job = await repostQueue.getJob(jobId);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        const state = await job.getState();
        const progress = job.progress();
        res.json({
            jobId: job.id,
            state,
            progress,
            data: job.data,
            attempts: job.attemptsMade,
            failedReason: job.failedReason,
            stacktrace: job.stacktrace,
        });
    }
    catch (err) {
        console.error('[Scheduler] Failed to get job status:', err);
        res.status(500).json({ error: err.message || 'Failed to get job status' });
    }
});
// DELETE /scheduler/jobs/:jobId: Cancel scheduled job
app.delete('/scheduler/jobs/:jobId', authMiddleware, async (req, res) => {
    const { jobId } = req.params;
    try {
        // Try to remove from all queues
        let removed = false;
        const job = await postingQueue.getJob(jobId);
        if (job) {
            await job.remove();
            removed = true;
        }
        if (!removed) {
            const job = await retryQueue.getJob(jobId);
            if (job) {
                await job.remove();
                removed = true;
            }
        }
        if (!removed) {
            const job = await analyticsQueue.getJob(jobId);
            if (job) {
                await job.remove();
                removed = true;
            }
        }
        if (!removed) {
            const job = await repostQueue.getJob(jobId);
            if (job) {
                await job.remove();
                removed = true;
            }
        }
        if (!removed) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.json({ success: true, message: 'Job cancelled' });
    }
    catch (err) {
        console.error('[Scheduler] Failed to cancel job:', err);
        res.status(500).json({ error: err.message || 'Failed to cancel job' });
    }
});
// GET /scheduler/status: Get queue health status
app.get('/scheduler/status', authMiddleware, async (req, res) => {
    const dealerId = req.userId || 'default-dealer';
    try {
        const postingCount = await postingQueue.count();
        const retryCount = await retryQueue.count();
        const analyticsCount = await analyticsQueue.count();
        const repostCount = await repostQueue.count();
        const postingFailed = await postingQueue.getFailedCount();
        const retryFailed = await retryQueue.getFailedCount();
        const analyticsFailed = await analyticsQueue.getFailedCount();
        const repostFailed = await repostQueue.getFailedCount();
        res.json({
            dealerId,
            queues: {
                posting: { pending: postingCount, failed: postingFailed },
                retry: { pending: retryCount, failed: retryFailed },
                analytics: { pending: analyticsCount, failed: analyticsFailed },
                repost: { pending: repostCount, failed: repostFailed },
            },
            totalPending: postingCount + retryCount + analyticsCount + repostCount,
            totalFailed: postingFailed + retryFailed + analyticsFailed + repostFailed,
        });
    }
    catch (err) {
        console.error('[Scheduler] Failed to get queue status:', err);
        res.status(500).json({ error: err.message || 'Failed to get queue status' });
    }
});
// ===== SLICE 15: ANALYTICS ENDPOINTS =====
// GET /analytics: Get dealer analytics for specified period
app.get('/analytics', authMiddleware, (req, res) => {
    const dealerId = req.userId || 'default-dealer';
    const period = req.query.period || 'all-time';
    try {
        // Try cache first
        const cached = getCachedAnalytics(dealerId, period);
        if (cached) {
            return res.json(cached);
        }
        // Generate fresh analytics
        const analytics = generateDealerAnalytics(dealerId, period);
        res.json(analytics);
    }
    catch (err) {
        console.error('[Analytics] Failed to generate analytics:', err);
        res.status(500).json({ error: err.message || 'Failed to generate analytics' });
    }
});
// GET /analytics/export: Export analytics as CSV
app.get('/analytics/export', authMiddleware, (req, res) => {
    const dealerId = req.userId || 'default-dealer';
    const period = req.query.period || 'all-time';
    try {
        const analytics = generateDealerAnalytics(dealerId, period);
        const csv = exportAnalyticsCSV(analytics);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-${dealerId}-${period}.csv"`);
        res.send(csv);
    }
    catch (err) {
        console.error('[Analytics] Failed to export analytics:', err);
        res.status(500).json({ error: err.message || 'Failed to export analytics' });
    }
});
// GET /analytics/refresh: Force refresh analytics cache
app.post('/analytics/refresh', authMiddleware, (req, res) => {
    const dealerId = req.userId || 'default-dealer';
    const period = req.body.period || 'all-time';
    try {
        const analytics = generateDealerAnalytics(dealerId, period);
        res.json({
            success: true,
            analytics,
            refreshedAt: new Date(),
        });
    }
    catch (err) {
        console.error('[Analytics] Failed to refresh analytics:', err);
        res.status(500).json({ error: err.message || 'Failed to refresh analytics' });
    }
});
//# sourceMappingURL=index.js.map