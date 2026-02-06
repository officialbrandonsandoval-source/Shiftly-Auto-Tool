/**
 * Analytics & Insights - aggregate metrics, generate dealer insights
 */
export interface DealerAnalytics {
    dealerId: string;
    period: 'daily' | 'weekly' | 'monthly' | 'all-time';
    startDate: Date;
    endDate: Date;
    totalPosts: number;
    activePosts: number;
    totalImpressions: number;
    totalClicks: number;
    totalLeads: number;
    totalConversions: number;
    clickThroughRate: number;
    conversionRate: number;
    platformBreakdown: PlatformMetrics[];
    topPerformers: VehiclePerformance[];
    underperformers: VehiclePerformance[];
    insights: Insight[];
}
export interface PlatformMetrics {
    platform: string;
    posts: number;
    impressions: number;
    clicks: number;
    leads: number;
    conversions: number;
    ctr: number;
    cvr: number;
}
export interface VehiclePerformance {
    vehicleId: string;
    make: string;
    model: string;
    year: number;
    price: number;
    posts: number;
    impressions: number;
    clicks: number;
    leads: number;
    conversions: number;
    ctr: number;
    cvr: number;
    daysListed: number;
    avgDailyImpressions: number;
    avgDailyClicks: number;
}
export interface Insight {
    type: 'success' | 'warning' | 'opportunity' | 'info';
    category: 'performance' | 'engagement' | 'pricing' | 'platform' | 'inventory';
    title: string;
    description: string;
    actionable: boolean;
    recommendation?: string;
}
/**
 * Generate analytics for a dealer
 */
export declare function generateDealerAnalytics(dealerId: string, period?: 'daily' | 'weekly' | 'monthly' | 'all-time'): DealerAnalytics;
/**
 * Get cached analytics (if available)
 */
export declare function getCachedAnalytics(dealerId: string, period: string): DealerAnalytics | null;
/**
 * Export analytics as CSV
 */
export declare function exportAnalyticsCSV(analytics: DealerAnalytics): string;
//# sourceMappingURL=analytics.d.ts.map