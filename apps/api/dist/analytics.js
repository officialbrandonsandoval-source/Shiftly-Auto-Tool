/**
 * Analytics & Insights - aggregate metrics, generate dealer insights
 */
import { getPostsByDealer } from './posts.js';
import { getVehicle } from './vehicles.js';
// In-memory cache (production: use DB with time-series data)
const analyticsCache = new Map();
/**
 * Generate analytics for a dealer
 */
export function generateDealerAnalytics(dealerId, period = 'all-time') {
    const posts = getPostsByDealer(dealerId);
    const { startDate, endDate } = getDateRange(period);
    // Filter posts by date range
    const periodPosts = posts.filter((p) => {
        const postDate = p.postedAt || p.createdAt;
        return postDate >= startDate && postDate <= endDate;
    });
    // Aggregate totals
    const totalImpressions = periodPosts.reduce((sum, p) => sum + p.impressions, 0);
    const totalClicks = periodPosts.reduce((sum, p) => sum + p.clicks, 0);
    const totalLeads = periodPosts.reduce((sum, p) => sum + p.leads, 0);
    const totalConversions = periodPosts.reduce((sum, p) => sum + p.conversions, 0);
    const clickThroughRate = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    // Platform breakdown
    const platformBreakdown = generatePlatformBreakdown(periodPosts);
    // Vehicle performance
    const vehiclePerformances = generateVehiclePerformances(periodPosts);
    const topPerformers = vehiclePerformances
        .sort((a, b) => b.conversions - a.conversions || b.clicks - a.clicks)
        .slice(0, 5);
    const underperformers = vehiclePerformances
        .filter((v) => v.daysListed >= 7 && v.clicks < 10)
        .sort((a, b) => a.clicks - b.clicks)
        .slice(0, 5);
    // Generate insights
    const insights = generateInsights(periodPosts, platformBreakdown, topPerformers, underperformers);
    const analytics = {
        dealerId,
        period,
        startDate,
        endDate,
        totalPosts: periodPosts.length,
        activePosts: periodPosts.filter((p) => p.status === 'posted').length,
        totalImpressions,
        totalClicks,
        totalLeads,
        totalConversions,
        clickThroughRate,
        conversionRate,
        platformBreakdown,
        topPerformers,
        underperformers,
        insights,
    };
    // Cache it
    const cacheKey = `${dealerId}-${period}`;
    analyticsCache.set(cacheKey, analytics);
    return analytics;
}
/**
 * Get cached analytics (if available)
 */
export function getCachedAnalytics(dealerId, period) {
    const cacheKey = `${dealerId}-${period}`;
    return analyticsCache.get(cacheKey) || null;
}
/**
 * Generate platform-specific metrics breakdown
 */
function generatePlatformBreakdown(posts) {
    const platformMap = new Map();
    posts.forEach((post) => {
        const platform = post.platform;
        const existing = platformMap.get(platform) || {
            platform,
            posts: 0,
            impressions: 0,
            clicks: 0,
            leads: 0,
            conversions: 0,
            ctr: 0,
            cvr: 0,
        };
        existing.posts += 1;
        existing.impressions += post.impressions;
        existing.clicks += post.clicks;
        existing.leads += post.leads;
        existing.conversions += post.conversions;
        platformMap.set(platform, existing);
    });
    // Calculate rates
    return Array.from(platformMap.values()).map((p) => ({
        ...p,
        ctr: p.impressions > 0 ? (p.clicks / p.impressions) * 100 : 0,
        cvr: p.clicks > 0 ? (p.conversions / p.clicks) * 100 : 0,
    }));
}
/**
 * Generate vehicle-level performance data
 */
function generateVehiclePerformances(posts) {
    const vehicleMap = new Map();
    // Group posts by vehicle
    posts.forEach((post) => {
        const existing = vehicleMap.get(post.vehicleId) || [];
        existing.push(post);
        vehicleMap.set(post.vehicleId, existing);
    });
    // Calculate performance for each vehicle
    const performances = [];
    vehicleMap.forEach((vehiclePosts, vehicleId) => {
        const vehicle = getVehicle(vehicleId);
        if (!vehicle)
            return;
        const totalImpressions = vehiclePosts.reduce((sum, p) => sum + p.impressions, 0);
        const totalClicks = vehiclePosts.reduce((sum, p) => sum + p.clicks, 0);
        const totalLeads = vehiclePosts.reduce((sum, p) => sum + p.leads, 0);
        const totalConversions = vehiclePosts.reduce((sum, p) => sum + p.conversions, 0);
        const firstPost = vehiclePosts.sort((a, b) => (a.postedAt?.getTime() || 0) - (b.postedAt?.getTime() || 0))[0];
        const daysListed = firstPost.postedAt
            ? Math.floor((Date.now() - firstPost.postedAt.getTime()) / (24 * 60 * 60 * 1000))
            : 0;
        performances.push({
            vehicleId,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            price: vehicle.price || 0,
            posts: vehiclePosts.length,
            impressions: totalImpressions,
            clicks: totalClicks,
            leads: totalLeads,
            conversions: totalConversions,
            ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
            cvr: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
            daysListed,
            avgDailyImpressions: daysListed > 0 ? totalImpressions / daysListed : 0,
            avgDailyClicks: daysListed > 0 ? totalClicks / daysListed : 0,
        });
    });
    return performances;
}
/**
 * Generate actionable insights from data
 */
function generateInsights(posts, platformBreakdown, topPerformers, underperformers) {
    const insights = [];
    // Overall performance insights
    const totalImpressions = posts.reduce((sum, p) => sum + p.impressions, 0);
    const totalClicks = posts.reduce((sum, p) => sum + p.clicks, 0);
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    if (avgCTR < 1) {
        insights.push({
            type: 'warning',
            category: 'engagement',
            title: 'Low Click-Through Rate',
            description: `Your average CTR is ${avgCTR.toFixed(2)}%, which is below the industry standard (1-2%). Consider improving listing titles and photos.`,
            actionable: true,
            recommendation: 'Use AI-generated titles and rank photos by quality.',
        });
    }
    else if (avgCTR > 3) {
        insights.push({
            type: 'success',
            category: 'engagement',
            title: 'Excellent Click-Through Rate',
            description: `Your average CTR is ${avgCTR.toFixed(2)}%, which is well above industry average. Your listings are highly engaging!`,
            actionable: false,
        });
    }
    // Platform performance insights
    const bestPlatform = platformBreakdown.sort((a, b) => b.conversions - a.conversions)[0];
    if (bestPlatform && bestPlatform.conversions > 0) {
        insights.push({
            type: 'success',
            category: 'platform',
            title: `${bestPlatform.platform} is your top platform`,
            description: `${bestPlatform.conversions} conversions from ${bestPlatform.posts} posts. Consider focusing more effort here.`,
            actionable: true,
            recommendation: `Increase posting frequency on ${bestPlatform.platform}.`,
        });
    }
    // Underperformer insights
    if (underperformers.length > 0) {
        insights.push({
            type: 'opportunity',
            category: 'inventory',
            title: `${underperformers.length} vehicles need attention`,
            description: `These vehicles have low engagement after 7+ days. Consider price adjustments or reposting.`,
            actionable: true,
            recommendation: 'Enable auto-repost for low-engagement vehicles or reduce prices by 5-10%.',
        });
    }
    // Top performer insights
    if (topPerformers.length > 0) {
        const topVehicle = topPerformers[0];
        insights.push({
            type: 'success',
            category: 'performance',
            title: 'Top performer identified',
            description: `${topVehicle.year} ${topVehicle.make} ${topVehicle.model} has ${topVehicle.conversions} conversions with ${topVehicle.clicks} clicks.`,
            actionable: false,
        });
    }
    // Pricing insights
    const highPriceUnderperformers = underperformers.filter((v) => v.price > 30000);
    if (highPriceUnderperformers.length > 0) {
        insights.push({
            type: 'opportunity',
            category: 'pricing',
            title: 'High-priced vehicles struggling',
            description: `${highPriceUnderperformers.length} vehicles priced above $30k have low engagement. Market may be price-sensitive.`,
            actionable: true,
            recommendation: 'Consider highlighting financing options or reducing prices.',
        });
    }
    return insights;
}
/**
 * Get date range for period
 */
function getDateRange(period) {
    const endDate = new Date();
    let startDate = new Date();
    switch (period) {
        case 'daily':
            startDate.setDate(startDate.getDate() - 1);
            break;
        case 'weekly':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case 'monthly':
            startDate.setDate(startDate.getDate() - 30);
            break;
        case 'all-time':
            startDate = new Date(0); // Unix epoch
            break;
    }
    return { startDate, endDate };
}
/**
 * Export analytics as CSV
 */
export function exportAnalyticsCSV(analytics) {
    const rows = [];
    // Header
    rows.push('Metric,Value');
    rows.push(`Dealer ID,${analytics.dealerId}`);
    rows.push(`Period,${analytics.period}`);
    rows.push(`Start Date,${analytics.startDate.toISOString()}`);
    rows.push(`End Date,${analytics.endDate.toISOString()}`);
    rows.push(`Total Posts,${analytics.totalPosts}`);
    rows.push(`Active Posts,${analytics.activePosts}`);
    rows.push(`Total Impressions,${analytics.totalImpressions}`);
    rows.push(`Total Clicks,${analytics.totalClicks}`);
    rows.push(`Total Leads,${analytics.totalLeads}`);
    rows.push(`Total Conversions,${analytics.totalConversions}`);
    rows.push(`Click-Through Rate,${analytics.clickThroughRate.toFixed(2)}%`);
    rows.push(`Conversion Rate,${analytics.conversionRate.toFixed(2)}%`);
    rows.push('');
    rows.push('Platform Breakdown');
    rows.push('Platform,Posts,Impressions,Clicks,Leads,Conversions,CTR,CVR');
    analytics.platformBreakdown.forEach((p) => {
        rows.push(`${p.platform},${p.posts},${p.impressions},${p.clicks},${p.leads},${p.conversions},${p.ctr.toFixed(2)}%,${p.cvr.toFixed(2)}%`);
    });
    rows.push('');
    rows.push('Top Performers');
    rows.push('Vehicle,Year,Price,Impressions,Clicks,Conversions,CTR,Days Listed');
    analytics.topPerformers.forEach((v) => {
        rows.push(`${v.year} ${v.make} ${v.model},${v.year},$${v.price},${v.impressions},${v.clicks},${v.conversions},${v.ctr.toFixed(2)}%,${v.daysListed}`);
    });
    return rows.join('\n');
}
//# sourceMappingURL=analytics.js.map