import React, { useState, useEffect } from 'react'
import { ScrollView, RefreshControl } from 'react-native'
import { YStack, XStack, Text, Card, H2, H3, Separator, Button, Spinner } from 'tamagui'
import { useNavigation } from '@react-navigation/native'
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

  useEffect(() => {
    loadAnalytics()
  }, [period])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/analytics?period=${period}`)
      setAnalytics(response.data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadAnalytics()
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success':
        return '$green10'
      case 'warning':
        return '$orange10'
      case 'opportunity':
        return '$blue10'
      default:
        return '$gray10'
    }
  }

  if (loading && !analytics) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <Spinner size="large" />
        <Text marginTop="$4">Loading analytics...</Text>
      </YStack>
    )
  }

  if (!analytics) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <Text>No analytics available</Text>
        <Button marginTop="$4" onPress={loadAnalytics}>
          Retry
        </Button>
      </YStack>
    )
  }

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <YStack padding="$4" gap="$4">
        <H2>Analytics Dashboard</H2>

        {/* Period selector */}
        <XStack gap="$2" flexWrap="wrap">
          {(['daily', 'weekly', 'monthly', 'all-time'] as const).map((p) => (
            <Button
              key={p}
              size="$3"
              variant={period === p ? 'outlined' : 'ghost'}
              onPress={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
        </XStack>

        {/* Key metrics */}
        <Card padding="$4">
          <H3 marginBottom="$3">Overview</H3>
          <YStack gap="$2">
            <XStack justifyContent="space-between">
              <Text>Total Posts</Text>
              <Text fontWeight="bold">{analytics.totalPosts}</Text>
            </XStack>
            <XStack justifyContent="space-between">
              <Text>Active Posts</Text>
              <Text fontWeight="bold" color="$green10">
                {analytics.activePosts}
              </Text>
            </XStack>
            <Separator marginVertical="$2" />
            <XStack justifyContent="space-between">
              <Text>Impressions</Text>
              <Text fontWeight="bold">{analytics.totalImpressions.toLocaleString()}</Text>
            </XStack>
            <XStack justifyContent="space-between">
              <Text>Clicks</Text>
              <Text fontWeight="bold">{analytics.totalClicks.toLocaleString()}</Text>
            </XStack>
            <XStack justifyContent="space-between">
              <Text>Leads</Text>
              <Text fontWeight="bold">{analytics.totalLeads.toLocaleString()}</Text>
            </XStack>
            <XStack justifyContent="space-between">
              <Text>Conversions</Text>
              <Text fontWeight="bold" color="$green10">
                {analytics.totalConversions}
              </Text>
            </XStack>
            <Separator marginVertical="$2" />
            <XStack justifyContent="space-between">
              <Text>Click-Through Rate</Text>
              <Text fontWeight="bold">{analytics.clickThroughRate.toFixed(2)}%</Text>
            </XStack>
            <XStack justifyContent="space-between">
              <Text>Conversion Rate</Text>
              <Text fontWeight="bold">{analytics.conversionRate.toFixed(2)}%</Text>
            </XStack>
          </YStack>
        </Card>

        {/* Platform breakdown */}
        {analytics.platformBreakdown.length > 0 && (
          <Card padding="$4">
            <H3 marginBottom="$3">Platform Performance</H3>
            <YStack gap="$3">
              {analytics.platformBreakdown.map((platform) => (
                <YStack key={platform.platform} gap="$2">
                  <Text fontWeight="bold" textTransform="capitalize">
                    {platform.platform.replace('_', ' ')}
                  </Text>
                  <XStack justifyContent="space-between">
                    <Text fontSize="$2" color="$gray11">
                      Posts
                    </Text>
                    <Text fontSize="$2">{platform.posts}</Text>
                  </XStack>
                  <XStack justifyContent="space-between">
                    <Text fontSize="$2" color="$gray11">
                      Impressions
                    </Text>
                    <Text fontSize="$2">{platform.impressions.toLocaleString()}</Text>
                  </XStack>
                  <XStack justifyContent="space-between">
                    <Text fontSize="$2" color="$gray11">
                      Clicks
                    </Text>
                    <Text fontSize="$2">{platform.clicks.toLocaleString()}</Text>
                  </XStack>
                  <XStack justifyContent="space-between">
                    <Text fontSize="$2" color="$gray11">
                      CTR
                    </Text>
                    <Text fontSize="$2">{platform.ctr.toFixed(2)}%</Text>
                  </XStack>
                  <Separator marginVertical="$1" />
                </YStack>
              ))}
            </YStack>
          </Card>
        )}

        {/* Top performers */}
        {analytics.topPerformers.length > 0 && (
          <Card padding="$4">
            <H3 marginBottom="$3">Top Performers</H3>
            <YStack gap="$2">
              {analytics.topPerformers.map((vehicle) => (
                <XStack key={vehicle.vehicleId} justifyContent="space-between">
                  <Text flex={1}>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </Text>
                  <Text color="$green10" fontWeight="bold">
                    {vehicle.conversions} conversions
                  </Text>
                </XStack>
              ))}
            </YStack>
          </Card>
        )}

        {/* Insights */}
        {analytics.insights.length > 0 && (
          <Card padding="$4">
            <H3 marginBottom="$3">Insights & Recommendations</H3>
            <YStack gap="$3">
              {analytics.insights.map((insight, index) => (
                <Card
                  key={index}
                  backgroundColor={getInsightColor(insight.type)}
                  padding="$3"
                  borderRadius="$4"
                >
                  <Text fontWeight="bold" marginBottom="$2">
                    {insight.title}
                  </Text>
                  <Text fontSize="$2" marginBottom="$2">
                    {insight.description}
                  </Text>
                  {insight.recommendation && (
                    <Text fontSize="$2" fontStyle="italic" color="$gray12">
                      💡 {insight.recommendation}
                    </Text>
                  )}
                </Card>
              ))}
            </YStack>
          </Card>
        )}

        {/* Underperformers */}
        {analytics.underperformers.length > 0 && (
          <Card padding="$4">
            <H3 marginBottom="$3">Needs Attention</H3>
            <YStack gap="$2">
              {analytics.underperformers.map((vehicle) => (
                <XStack key={vehicle.vehicleId} justifyContent="space-between">
                  <Text flex={1}>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </Text>
                  <Text color="$orange10" fontSize="$2">
                    {vehicle.clicks} clicks
                  </Text>
                </XStack>
              ))}
            </YStack>
          </Card>
        )}
      </YStack>
    </ScrollView>
  )
}
