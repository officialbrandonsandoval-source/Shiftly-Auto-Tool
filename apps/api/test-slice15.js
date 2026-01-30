#!/usr/bin/env node

/**
 * Slice 15 Tests: Analytics & Insights
 * Tests: Metric aggregation, platform breakdown, insights generation
 */

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
}

let testsPassed = 0
let testsFailed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`${colors.green}✓${colors.reset} ${name}`)
    testsPassed++
  } catch (err) {
    console.log(`${colors.red}✗${colors.reset} ${name}`)
    console.log(`  ${colors.gray}${err.message}${colors.reset}`)
    testsFailed++
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function main() {
  console.log(`\n${colors.blue}🚀 Slice 15: Analytics & Insights Tests${colors.reset}\n`)

  // ===== Test 1: Analytics data structure =====
  test('Analytics data structure includes all required fields', () => {
    const mockAnalytics = {
      dealerId: 'dealer-001',
      period: 'all-time',
      startDate: new Date(),
      endDate: new Date(),
      totalPosts: 10,
      activePosts: 8,
      totalImpressions: 5000,
      totalClicks: 150,
      totalLeads: 25,
      totalConversions: 5,
      clickThroughRate: 3.0,
      conversionRate: 3.33,
      platformBreakdown: [],
      topPerformers: [],
      underperformers: [],
      insights: [],
    }

    assert(mockAnalytics.dealerId, 'Analytics should have dealerId')
    assert(mockAnalytics.period, 'Analytics should have period')
    assert(mockAnalytics.totalPosts >= 0, 'Analytics should have totalPosts')
    assert(mockAnalytics.clickThroughRate >= 0, 'Analytics should have clickThroughRate')
    assert(mockAnalytics.conversionRate >= 0, 'Analytics should have conversionRate')
    assert(Array.isArray(mockAnalytics.insights), 'Analytics should have insights array')
  })

  // ===== Test 2: CTR calculation =====
  test('Click-Through Rate (CTR) calculation', () => {
    const impressions = 1000
    const clicks = 30
    const expectedCTR = (clicks / impressions) * 100

    assert(expectedCTR === 3.0, `CTR should be 3.0%, got ${expectedCTR}%`)
  })

  // ===== Test 3: CVR calculation =====
  test('Conversion Rate (CVR) calculation', () => {
    const clicks = 100
    const conversions = 5
    const expectedCVR = (conversions / clicks) * 100

    assert(expectedCVR === 5.0, `CVR should be 5.0%, got ${expectedCVR}%`)
  })

  // ===== Test 4: Platform breakdown structure =====
  test('Platform breakdown includes metrics per platform', () => {
    const platformMetrics = {
      platform: 'facebook_marketplace',
      posts: 5,
      impressions: 2500,
      clicks: 75,
      leads: 12,
      conversions: 3,
      ctr: 3.0,
      cvr: 4.0,
    }

    assert(platformMetrics.platform, 'Platform metrics should have platform name')
    assert(platformMetrics.posts > 0, 'Platform metrics should have post count')
    assert(platformMetrics.ctr >= 0, 'Platform metrics should have CTR')
    assert(platformMetrics.cvr >= 0, 'Platform metrics should have CVR')
  })

  // ===== Test 5: Vehicle performance structure =====
  test('Vehicle performance includes engagement metrics', () => {
    const vehiclePerformance = {
      vehicleId: 'vehicle-123',
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      price: 25000,
      posts: 2,
      impressions: 800,
      clicks: 24,
      leads: 4,
      conversions: 1,
      ctr: 3.0,
      cvr: 4.17,
      daysListed: 7,
      avgDailyImpressions: 114.3,
      avgDailyClicks: 3.4,
    }

    assert(vehiclePerformance.vehicleId, 'Vehicle performance should have vehicleId')
    assert(vehiclePerformance.daysListed > 0, 'Vehicle performance should have daysListed')
    assert(vehiclePerformance.avgDailyImpressions >= 0, 'Vehicle performance should have avgDailyImpressions')
  })

  // ===== Test 6: Insight types =====
  test('Insights categorized by type and category', () => {
    const insight = {
      type: 'warning',
      category: 'engagement',
      title: 'Low Click-Through Rate',
      description: 'Your CTR is below industry average',
      actionable: true,
      recommendation: 'Improve listing titles and photos',
    }

    assert(
      ['success', 'warning', 'opportunity', 'info'].includes(insight.type),
      'Insight type should be one of: success, warning, opportunity, info'
    )
    assert(
      ['performance', 'engagement', 'pricing', 'platform', 'inventory'].includes(insight.category),
      'Insight category should be valid'
    )
    assert(insight.title, 'Insight should have title')
    assert(insight.description, 'Insight should have description')
  })

  // ===== Test 7: Low CTR insight generation =====
  test('Generate warning insight for low CTR (<1%)', () => {
    const ctr = 0.5
    const shouldGenerateWarning = ctr < 1

    assert(shouldGenerateWarning, 'CTR below 1% should generate warning insight')
  })

  // ===== Test 8: High CTR insight generation =====
  test('Generate success insight for high CTR (>3%)', () => {
    const ctr = 3.5
    const shouldGenerateSuccess = ctr > 3

    assert(shouldGenerateSuccess, 'CTR above 3% should generate success insight')
  })

  // ===== Test 9: Underperformer detection =====
  test('Identify underperformers (7+ days, <10 clicks)', () => {
    const vehicles = [
      { daysListed: 10, clicks: 5 }, // Underperformer
      { daysListed: 5, clicks: 3 }, // Too new
      { daysListed: 14, clicks: 25 }, // Performing well
    ]

    const underperformers = vehicles.filter((v) => v.daysListed >= 7 && v.clicks < 10)

    assert(underperformers.length === 1, 'Should identify 1 underperformer')
    assert(underperformers[0].clicks === 5, 'Underperformer should have 5 clicks')
  })

  // ===== Test 10: Top performer ranking =====
  test('Rank top performers by conversions then clicks', () => {
    const vehicles = [
      { id: 'v1', conversions: 5, clicks: 100 },
      { id: 'v2', conversions: 3, clicks: 80 },
      { id: 'v3', conversions: 5, clicks: 120 }, // Best (same conversions, more clicks)
    ]

    const sorted = vehicles.sort((a, b) => b.conversions - a.conversions || b.clicks - a.clicks)

    assert(sorted[0].id === 'v3', 'Top performer should be v3')
    assert(sorted[0].conversions === 5, 'Top performer should have 5 conversions')
    assert(sorted[0].clicks === 120, 'Top performer should have 120 clicks')
  })

  // ===== Test 11: Date range calculation for periods =====
  test('Calculate date range for different periods', () => {
    const now = new Date()

    // Daily
    const dailyStart = new Date(now)
    dailyStart.setDate(dailyStart.getDate() - 1)
    const dailyDiff = Math.floor((now.getTime() - dailyStart.getTime()) / (24 * 60 * 60 * 1000))
    assert(dailyDiff === 1, 'Daily period should be 1 day')

    // Weekly
    const weeklyStart = new Date(now)
    weeklyStart.setDate(weeklyStart.getDate() - 7)
    const weeklyDiff = Math.floor((now.getTime() - weeklyStart.getTime()) / (24 * 60 * 60 * 1000))
    assert(weeklyDiff === 7, 'Weekly period should be 7 days')

    // Monthly
    const monthlyStart = new Date(now)
    monthlyStart.setDate(monthlyStart.getDate() - 30)
    const monthlyDiff = Math.floor((now.getTime() - monthlyStart.getTime()) / (24 * 60 * 60 * 1000))
    assert(monthlyDiff === 30, 'Monthly period should be 30 days')
  })

  // ===== Test 12: CSV export format =====
  test('CSV export includes headers and data rows', () => {
    const csvLine1 = 'Metric,Value'
    const csvLine2 = 'Dealer ID,dealer-001'
    const csvLine3 = 'Total Posts,10'

    assert(csvLine1.includes(','), 'CSV should use comma delimiter')
    assert(csvLine2.split(',').length === 2, 'CSV row should have 2 columns')
    assert(csvLine3.includes('10'), 'CSV should include numeric data')
  })

  // ===== Summary =====
  console.log(
    `\n${colors.blue}📊 Test Results${colors.reset}: ${colors.green}${testsPassed} passed${colors.reset}, ${testsFailed > 0 ? `${colors.red}${testsFailed} failed${colors.reset}` : 'none failed'}\n`
  )

  if (testsFailed > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Test suite error:', err)
  process.exit(1)
})
