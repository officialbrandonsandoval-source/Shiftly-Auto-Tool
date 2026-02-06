# Feature Roadmap - V3 Enhancements

## Business Model
**Pricing:** $2,999/month per rooftop (dealership location)

**Target Market:** Automotive dealerships with 5-50 salespeople per location

**Value Proposition:** Automated social media posting, AI-generated content, team analytics, and centralized management

## Overview
This document outlines the architectural approach for implementing the next phase of features focused on AI background generation, human-like posting behavior, multi-tenant authentication, and salesman analytics.

---

## Feature 1: AI Background Generator 🎨

### Goal
Remove dealership branding from vehicle photos and replace with AI-generated professional backgrounds.

### Architecture Approach

#### Option A: Remove.bg + Stable Diffusion (Recommended)
```
Vehicle Photo → Remove.bg API (background removal) → Stable Diffusion (generate new background) → Composite Image
```

**Pros:**
- High quality background removal
- Cost-effective ($0.20/image for remove.bg)
- Full control over background style
- Can generate consistent dealership-neutral backgrounds

**Cons:**
- Requires two API calls per image
- Slight delay in processing

#### Option B: Segmind API (All-in-one)
- Single API for both removal and generation
- Faster but less control

#### Option C: Open Source (Rembg + SD)
- Self-hosted solution
- No per-image costs
- Requires GPU infrastructure

### Implementation Steps

**Phase 1: Background Removal Service**
```typescript
// apps/api/src/ai/backgroundService.ts
export async function removeBackground(imageUrl: string): Promise<Buffer>
export async function generateBackground(prompt: string): Promise<Buffer>
export async function compositeImages(subject: Buffer, background: Buffer): Promise<Buffer>
```

**Phase 2: Integration with Listing Flow**
- Add `processVehicleImages` step before posting
- Store both original and processed images
- Add user preference toggle: "Use AI backgrounds"

**Phase 3: Background Library**
- Pre-generate 20-30 professional backgrounds
- Rotate randomly to avoid repetition
- Styles: studio, outdoor scenic, urban, showroom floor

### Cost Estimation
- Remove.bg: $0.20/image
- Stable Diffusion (Replicate): $0.0023/image
- **Total: ~$0.21 per vehicle photo**
- For 100 vehicles/month: ~$21/month

**ROI for Dealership:**
- At $2,999/month, this feature costs < 0.7% of revenue
- Professional photos = higher engagement = more sales
- **Justification:** Premium feature worth the cost

---

## Feature 2: Human-like Facebook Posting 🤖→👤

### Goal
Simulate human typing behavior to avoid Facebook's automation detection.

### ⚠️ CRITICAL CONSIDERATIONS

**Pros:**
- More realistic posting behavior
- Potentially lower detection risk
- Can interact with UI elements API doesn't expose

**Cons:**
- **Violates Facebook Terms of Service** (automation via scraping)
- Risk of account bans
- Much slower than Graph API
- Requires maintaining browser sessions
- More complex error handling

### Architecture Approach

#### Option A: Playwright/Puppeteer (Browser Automation)
```typescript
// apps/api/src/automation/facebookBrowser.ts
import { chromium } from 'playwright'

export async function humanLikePost(listing: ListingPackage, credentials: FacebookCreds) {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()
  
  // Login with cookies
  await page.goto('https://facebook.com/marketplace/create/vehicle')
  
  // Type with human-like delays
  await humanType(page, '#title', listing.title, { minDelay: 50, maxDelay: 150 })
  await randomPause(1000, 3000)
  await humanType(page, '#description', listing.description, { minDelay: 30, maxDelay: 120 })
  
  // Random mouse movements
  await randomMouseMovement(page)
  
  // Upload photos with delays
  for (const photo of listing.photos) {
    await page.setInputFiles('input[type="file"]', photo)
    await randomPause(2000, 4000)
  }
  
  // Submit
  await page.click('button[type="submit"]')
  await page.waitForNavigation()
}

function humanType(page, selector, text, delays) {
  // Type character by character with random delays
  // Add occasional backspaces/corrections
  // Simulate copy-paste for some text
}
```

**Features:**
- Random typing speed variations
- Occasional backspaces/corrections
- Mouse movements between fields
- Random pauses
- Session persistence

#### Option B: Hybrid Approach (Recommended)
- Use Graph API by default (fast, compliant)
- Offer browser automation as opt-in "stealth mode"
- Require user acknowledgment of risks

### Implementation Steps

**Phase 1: Research & Prototyping**
- Test Playwright on Facebook Marketplace
- Measure success rate
- Document detection patterns

**Phase 2: Core Automation Engine**
- Build `humanType` utility
- Implement random delays/pauses
- Cookie-based session management

**Phase 3: Integration**
- Add "Posting Mode" setting: API vs Browser
- Implement fallback logic
- Rate limiting (1 post per 5-10 minutes)

### Risk Mitigation
- Rotate IP addresses (proxy pool)
- Session fingerprinting prevention
- Monitor account health
- Implement cooldown periods

**Recommendation:** Start with Graph API, only add browser automation if users report detection issues.

---

## Feature 3: Multi-Tenant Authentication System 🔐

### Goal
Enable dealerships to manage multiple salespeople under one account with centralized billing and Facebook OAuth.

### Architecture Approach

#### Database Schema
```typescript
// Dealerships (top-level organization)
interface Dealership {
  id: string
  name: string
  apiKey: string // Master API key for backend access
  billingEmail: string
  subscriptionTier: 'free' | 'basic' | 'pro' | 'enterprise'
  monthlyPostLimit: number
  createdAt: Date
}

// Users (salespeople)
interface User {
  id: string
  dealershipId: string
  email: string
  name: string
  role: 'admin' | 'salesperson' | 'manager'
  facebookAccessToken?: string
  facebookUserId?: string
  facebookPageId?: string // For Marketplace posting
  isActive: boolean
  createdAt: Date
}

// Facebook OAuth Tokens
interface FacebookAuth {
  userId: string
  accessToken: string
  refreshToken?: string
  expiresAt: Date
  pageAccessToken?: string // For posting to Marketplace
  permissions: string[]
}

// API Keys (for backend access)
interface ApiKey {
  key: string
  dealershipId: string
  name: string // "Dealership Master Key", "Integration Key", etc.
  createdAt: Date
  lastUsedAt?: Date
}
```

#### Authentication Flows

**Flow 1: Dealership Onboarding**
```
1. Dealership signs up → Creates account
2. System generates master API key
3. Admin invites salespeople via email
4. Salespeople create accounts and link to dealership
```

**Flow 2: Facebook OAuth (Per User)**
```
1. User clicks "Connect Facebook"
2. Redirect to Facebook OAuth
3. Request permissions: pages_manage_posts, pages_read_engagement
4. Store access token per user
5. User can now post with their own Facebook account
```

**Flow 3: API Access (Backend Integration)**
```
1. Mobile app includes dealership API key in header
2. Backend validates key and retrieves dealership
3. User authentication happens via JWT
4. All posts are tracked to specific user
```

### Implementation Steps

**Phase 1: Database Migration**
- Switch from in-memory Maps to PostgreSQL/MongoDB
- Implement schema above
- Seed migration script

**Phase 2: Authentication Service**
```typescript
// apps/api/src/auth/authService.ts
export async function createDealership(data: CreateDealershipDto): Promise<Dealership>
export async function generateApiKey(dealershipId: string): Promise<string>
export async function validateApiKey(key: string): Promise<Dealership | null>
export async function inviteUser(dealershipId: string, email: string): Promise<void>
```

**Phase 3: Facebook OAuth Flow**
```typescript
// apps/api/src/auth/facebookOAuth.ts
export async function getOAuthUrl(userId: string): Promise<string>
export async function handleCallback(code: string, userId: string): Promise<FacebookAuth>
export async function refreshAccessToken(userId: string): Promise<string>
```

**Phase 4: Mobile App Updates**
- Add login screen
- Add dealership selection
- Add Facebook connect button
- Store JWT token securely

**Phase 5: Middleware & Authorization**
```typescript
// apps/api/src/middleware/auth.ts
export function requireAuth(req, res, next) // Validate JWT
export function requireDealership(req, res, next) // Validate API key
export function requireRole(role: string) // Check user role
```

### Database Choice

**Option A: PostgreSQL (Recommended)**
- Strong relational model
- ACID compliance
- Good for user management
- Mature ORMs (Prisma, TypeORM)

**Option B: MongoDB**
- Flexible schema
- Faster for analytics
- Already using MongoDB MCP in workspace

**Recommendation:** Use PostgreSQL for auth/users, keep MongoDB for analytics data.

---

## Feature 4: Salesman Analytics & Leaderboard 📊

### Goal
Track posting performance per salesperson with leaderboards and detailed metrics.

### Architecture Approach

#### Data Model
```typescript
interface PostMetrics {
  id: string
  userId: string // Which salesperson
  dealershipId: string
  vehicleId: string
  listingId: string
  platform: 'facebook_marketplace'
  
  // Posting stats
  postedAt: Date
  status: 'posted' | 'failed' | 'removed'
  
  // Engagement metrics (from Facebook API)
  views: number
  saves: number
  inquiries: number
  clickThroughs: number
  
  // Performance
  timeToFirstInquiry?: number // minutes
  conversionRate?: number // inquiries per view
  
  // Sync
  lastSyncedAt: Date
}

interface SalesmanStats {
  userId: string
  period: 'day' | 'week' | 'month' | 'all'
  
  // Volume
  totalPosts: number
  successfulPosts: number
  failedPosts: number
  
  // Engagement
  totalViews: number
  totalInquiries: number
  totalSaves: number
  avgViewsPerPost: number
  avgInquiriesPerPost: number
  
  // Performance
  conversionRate: number // inquiries / views
  avgTimeToFirstInquiry: number
  responseRate: number // how often they respond to inquiries
  
  // Rankings
  rank: number // Among dealership
  percentile: number
}
```

#### Leaderboard Features

**Real-time Stats:**
- Posts today/week/month
- Total engagement
- Conversion rate
- Response time

**Gamification:**
- Badges: "Top Poster", "Best Converter", "Quick Responder"
- Streaks: "Posted 7 days in a row"
- Achievements: "100 posts", "500 total inquiries"

**Manager View:**
- Team overview
- Individual performance
- Export reports
- Set goals/targets

### Implementation Steps

**Phase 1: Metrics Collection**
```typescript
// apps/api/src/analytics/metricsService.ts
export async function trackPost(userId: string, listingId: string, status: string)
export async function updateEngagement(listingId: string, metrics: EngagementMetrics)
export async function calculateStats(userId: string, period: string): Promise<SalesmanStats>
```

**Phase 2: Leaderboard API**
```typescript
// apps/api/src/analytics/leaderboard.ts
export async function getDealershipLeaderboard(dealershipId: string, period: string)
export async function getUserRank(userId: string, period: string)
export async function getTopPerformers(dealershipId: string, metric: string, limit: number)
```

**Phase 3: Mobile UI Updates**
- Enhance AnalyticsScreen with personal stats
- Add LeaderboardScreen
- Add real-time notifications: "You moved up 2 ranks!"

**Phase 4: Data Sync**
- Scheduled job to fetch Facebook insights
- Update post metrics every hour
- Calculate leaderboard rankings daily

### UI Mockup

```
┌─────────────────────────────────────┐
│  Salesman Analytics                  │
├─────────────────────────────────────┤
│  Your Stats (This Week)              │
│  • Posts: 12                         │
│  • Views: 3,420                      │
│  • Inquiries: 48 (1.4%)             │
│  • Avg Response Time: 12 min        │
├─────────────────────────────────────┤
│  Leaderboard                         │
│  🥇 Sarah Johnson - 18 posts         │
│  🥈 Mike Davis - 15 posts            │
│  🥉 YOU - 12 posts                   │
│  4️⃣ John Smith - 10 posts           │
│  5️⃣ Lisa Brown - 8 posts            │
├─────────────────────────────────────┤
│  Achievements                        │
│  🏆 Quick Responder (< 15 min avg)  │
│  ⭐ 10 Day Streak                    │
│  📈 Most Improved This Week          │
└─────────────────────────────────────┘
```
 🔐
**Priority: Authentication & Multi-tenancy**
- Set up PostgreSQL database
- Implement dealership/user models
- Build authentication endpoints
- Update mobile app with login flow
- **Deliverable:** Users can sign in, dealerships can manage team
- **Business Impact:** Enables $2,999/month recurring revenue per dealership

### Phase 2: Analytics Infrastructure (Week 3) 📊
**Priority: Salesman Stats & Leaderboard**
- Implement metrics tracking
- Build leaderboard API
- Update AnalyticsScreen
- Add LeaderboardScreen
- **Deliverable:** Salespeople can see their stats and rankings
- **Business Impact:** Gamification drives adoption and daily usage

### Phase 3: AI Background Generator (Week 4-5) 🎨
**Priority: Image Processing**
- Integrate Remove.bg API
- Set up Stable Diffusion
- Build image compositing pipeline
- Add to listing workflow
- **Deliverable:** Vehicle photos have professional AI backgrounds
- **Business Impact:** Premium feature that justifies $2,999 price point

### Phase 4: Human-like Posting (Week 6-7) ⚠️ OPTIONAL 🤖
**Priority: Browser Automation**
- Research detection patterns
- Build Playwright integration
- Implement typing simulation
- Add as opt-in feature
- **Deliverable:** Stealth posting mode available
- **Business Impact:** Reduces account ban risk, improves longevity

---

## Feature Priority Matrix (Based on $2,999 Pricing)

### Must-Have (Justify Premium Price)
1. **Multi-tenant auth** - Without this, can't sell to dealerships
2. **AI backgrounds** - Premium feature that competitors lack
3. **Salesman analytics** - Drives team adoption and management buy-in

### Nice-to-Have (Competitive Advantages)
4. **Human-like posting** - Risk mitigation, but Graph API works fine for now
5. **Advanced scheduling** - Already have basic scheduling
6. **Custom branding** - Dealership logos on reports

### Future Enhancements (Scale Features)
- Integration with DMS systems (DealerSocket, CDK, Reynolds)
- Multi-platform expansion (Instagram, TikTok) if demand exists
- White-label option for resellers
- API for third-party integrations
- Research detection patterns
- Build Playwright integration
- Implement typing simulation
- Add as opt-in feature
- **Deliverable:** Stealth posting mode available

---

## Cost Analysis

### Monthly Operating Costs Per Dealership

**Database:**
- PostgreSQL (Render): $7/month (Starter)
- OR Railway: $5/month (usage-based)

**AI Services:**
- Remove.bg: ~$21/month (100 vehicles)
- Stable Diffusion (Replicate): ~$0.23/month
- **Total: ~$21.23/month**

**Hosting:**
- API Backend (Render): $7/month (already paying)
- No change

**Facebook API:**
- Free (within rate limits)

**Browser Automation (if implemented):**
- Proxy service: $20-50/month (optional)

**Total Estimated: $33-58/month per dealership**

### ROI Analysis

**Revenue:** $2,999/month per rooftop

**Operating Costs:** ~$58/month per dealership (worst case)

**Gross Margin:** $2,941/month per dealership (98.1% margin)

**Cost as % of Revenue:** 1.9%

**Implications:**
- ✅ Plenty of room for premium features
- ✅ Can afford high-quality AI services (Remove.bg over cheaper alternatives)
- ✅ Budget for proxy services if browser automation needed
- ✅Recommended Strategy for $2,999/month Product

Given the premium pricing, I recommend:

### ✅ DO THESE FIRST (Weeks 1-5)
1. **Multi-tenant Authentication** (Week 1-2)
   - Critical for onboarding paying customers
   - Enables team management
   - Required for any revenue

2. **Salesman Analytics** (Week 3)
   - Justifies price to sales managers
   - Drives daily engagement
   - Creates competitive atmosphere among team

3. **AI Background Generator** (Week 4-5)
   - Premium feature competitors don't have
   - Visible quality improvement
   - Strong selling point in demos

### 🤔 EVALUATE LATER (Week 6+)
4. **Human-like Posting**
   - Only if Graph API causes ban issues
   - High development/maintenance cost
   - Legal/TOS risks

### 💰 INFRASTRUCTURE UPGRADES
With 98% margins, consider:
- **Better hosting:** Upgrade to $20/month tier for faster performance
- **CDN:** Cloudflare for image delivery
- **Monitoring:** Sentry for error tracking, Datadog for performance
- **Support tools:** Intercom or Zendesk for customer success

---

## Next Steps

**Immediate Actions:**
1. ✅ Set up PostgreSQL database
2. ✅ Design dealership/user schema
3. ✅ Build authentication endpoints
4. ✅ Create login/signup UI in mobile app

**Questions to Answer:**
- Ready to start with authentication? (Recommended)
- Do you have Remove.bg API key, or should we sign up?
- Need help with pricing tiers (Basic/Pro/Enterprise)?
- Want to add payment integration (Stripe)?

**Ready to build Phase 1 when you are!** 🚀
- [ ] Self-hosted (no recurring costs)

### 3. Facebook Posting Strategy
- [ ] Graph API only (safe, compliant)
- [ ] Browser automation only (risky)
- [ ] Hybrid (API default, browser opt-in)

### 4. Authentication
- [ ] JWT tokens
- [ ] Session-based
- [ ] OAuth2 only

---

## Next Steps

**Immediate Actions:**
1. Choose database (Postgres recommended)
2. Design database schema
3. Set up authentication service
4. Build login UI in mobile app

**Questions to Answer:**
- What's your preferred database?
- Should we implement browser automation or stick with Graph API?
- What AI background service fits your budget?
- Do you want to prioritize analytics or auth first?

Let me know which features to tackle first!
