import React, { useState, useEffect } from 'react'
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native'
import { api } from '../api/client'

interface DealerAnalytics {
  dealerId: string
  period: string
  totalPosts: number
  activePosts: number
  totalImpressions: number
  totalClicks: number
  totalLeads: number
  totalConversions: number
  clickThroughRate: number
  conversionRate: number
  platformBreakdown: PlatformMetrics[]
  topPerformers: VehiclePerformance[]
  underperformers: VehiclePerformance[]
  insights: Insight[]
}

interface PlatformMetrics {
  platform: string
  posts: number
  impressions: number
  clicks: number
  ctr: number
}

interface VehiclePerformance {
  vehicleId: string
  make: string
  model: string
  year: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
}

interface Insight {
  type: 'success' | 'warning' | 'opportunity' | 'info'
  category: string
  title: string
  description: string
  actionable: boolean
  recommendation?: string
}

export default function AnalyticsScreen() {
  const [analytics, setAnalytics] = useState<DealerAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all-time'>('all-time')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [period])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/analytics?period=${period}`)
      setAnalytics(response.data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
      setError('Failed to load analytics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadAnalytics()
  }

  if (loading && !analytics) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    )
  }

  if (!analytics) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'No analytics available'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAnalytics}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <View style={styles.periodRow}>
          {(['daily', 'weekly', 'monthly', 'all-time'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodButton, period === p && styles.periodButtonActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodButtonText, period === p && styles.periodButtonTextActive]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.metricRow}>
          <Text>Total Posts</Text>
          <Text style={styles.metricValue}>{analytics.totalPosts}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text>Active Posts</Text>
          <Text style={styles.metricValue}>{analytics.activePosts}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text>Impressions</Text>
          <Text style={styles.metricValue}>{analytics.totalImpressions.toLocaleString()}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text>Clicks</Text>
          <Text style={styles.metricValue}>{analytics.totalClicks.toLocaleString()}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text>Leads</Text>
          <Text style={styles.metricValue}>{analytics.totalLeads.toLocaleString()}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text>Conversions</Text>
          <Text style={styles.metricValue}>{analytics.totalConversions}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text>Click-Through Rate</Text>
          <Text style={styles.metricValue}>{analytics.clickThroughRate.toFixed(2)}%</Text>
        </View>
        <View style={styles.metricRow}>
          <Text>Conversion Rate</Text>
          <Text style={styles.metricValue}>{analytics.conversionRate.toFixed(2)}%</Text>
        </View>
      </View>

      {analytics.platformBreakdown.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Platform Performance</Text>
          {analytics.platformBreakdown.map((platform) => (
            <View key={platform.platform} style={styles.subCard}>
              <Text style={styles.subTitle}>{platform.platform.replace('_', ' ')}</Text>
              <View style={styles.metricRow}>
                <Text>Posts</Text>
                <Text>{platform.posts}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text>Impressions</Text>
                <Text>{platform.impressions.toLocaleString()}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text>Clicks</Text>
                <Text>{platform.clicks.toLocaleString()}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text>CTR</Text>
                <Text>{platform.ctr.toFixed(2)}%</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {analytics.topPerformers.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Top Performers</Text>
          {analytics.topPerformers.map((vehicle) => (
            <View key={vehicle.vehicleId} style={styles.metricRow}>
              <Text>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Text>
              <Text>{vehicle.conversions} conversions</Text>
            </View>
          ))}
        </View>
      )}

      {analytics.insights.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Insights & Recommendations</Text>
          {analytics.insights.map((insight, index) => (
            <View key={index} style={[styles.subCard, getInsightStyle(insight.type)]}>
              <Text style={styles.subTitle}>{insight.title}</Text>
              <Text style={styles.bodyText}>{insight.description}</Text>
              {insight.recommendation && (
                <Text style={styles.recommendationText}>💡 {insight.recommendation}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {analytics.underperformers.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Needs Attention</Text>
          {analytics.underperformers.map((vehicle) => (
            <View key={vehicle.vehicleId} style={styles.metricRow}>
              <Text>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Text>
              <Text>{vehicle.clicks} clicks</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

function getInsightStyle(type: string) {
  switch (type) {
    case 'success':
      return styles.insightSuccess
    case 'warning':
      return styles.insightWarning
    case 'opportunity':
      return styles.insightOpportunity
    default:
      return styles.insightInfo
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    fontSize: 16,
    color: '#b91c1c',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  subCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111827',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111827',
  },
  subTitle: {
    fontWeight: '700',
    marginBottom: 6,
    color: '#111827',
  },
  bodyText: {
    color: '#374151',
  },
  recommendationText: {
    marginTop: 6,
    fontStyle: 'italic',
    color: '#374151',
  },
  periodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
  },
  periodButtonActive: {
    backgroundColor: '#2563eb',
  },
  periodButtonText: {
    color: '#374151',
  },
  periodButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricValue: {
    fontWeight: '600',
  },
  insightSuccess: {
    backgroundColor: '#dcfce7',
  },
  insightWarning: {
    backgroundColor: '#ffedd5',
  },
  insightOpportunity: {
    backgroundColor: '#dbeafe',
  },
  insightInfo: {
    backgroundColor: '#f3f4f6',
  },
})
