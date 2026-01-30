# Shiftly Auto Tool — V2 Roadmap
## Fully Autonomous Dealer Inventory Automation

---

## Vision
Transform from **manual export tool** to **fully autonomous multi-platform posting engine**.

Dealers connect inventory once. The system automatically:
1. **Generates optimized listings** (AI-powered, platform-specific copy + photo ranking)
2. **Distributes strategically** across Facebook Marketplace (anchor) → other platforms
3. **Schedules intelligently** (posts at optimal times, rotates inventory, re-lists declining vehicles)
4. **Measures everything** (views, leads, conversions, ROI per listing)

**Anchor platform:** Facebook Marketplace  
**AI engine:** Claude (Anthropic) — accuracy + cost-efficiency  
**Timeline:** Slices 12–16 (6-8 weeks from v1 completion)

---

## Architecture Changes

### V1 (current)
```
Mobile App
    ↓
API (REST)
    ↓
Inventory DB + Sync logs + Diagnostics
```

### V2 (additions)
```
Mobile App
    ↓
API (REST)
    ├─ Listing generation (Claude)
    ├─ Post scheduler (cron/job queue)
    ├─ Platform connectors (FB, Craigslist, etc.)
    ├─ Analytics aggregator
    └─ Existing: Sync, Auth, Diagnostics
    ↓
Message Queue (Bull/RabbitMQ for async jobs)
    ↓
Worker Service (schedule posts, track metrics)
    ↓
External APIs (FB Graph, Craigslist, etc.)
```

### New tables/entities
- `ListingGeneration` — Generated listing + AI metadata (copy variations, photo rank, keywords)
- `PostJob` — Scheduled post (vehicle, platform, time, status, result)
- `PostingMetrics` — Impressions, clicks, leads, conversions per post
- `PlatformCredential` — OAuth tokens (encrypted) for FB, Craigslist, etc.

---

## Slices (V2)

### Slice 12 — Facebook Marketplace Integration
**Goal:** Post directly to Facebook from the app.  
**Deliverables:**
- Facebook App registration + OAuth flow
- ProviderConnection for FB credentials (OAuth token storage, encrypted)
- Post endpoint: `POST /posts/marketplace` (vehicle → FB listing)
- Credential management: connect FB account once, stays connected
**DoD:**
- Dealer logs in with FB account
- App posts a vehicle to their FB Marketplace
- Post appears live (manually verified in FB)
**Test Evidence:**
- `cd apps/api && node test-slice12.js`
  - ✓ OAuth callback handler working
  - ✓ FB token encrypted and stored
  - ✓ Post to FB Graph API returns post ID
  - ✓ Posted vehicle appears in FB Marketplace
- Files created:
  - `apps/api/src/platforms/FacebookMarketplace.ts` (FB Graph API wrapper)
  - `apps/api/src/posts.ts` (Post job + tracking)
  - `apps/mobile/src/screens/ConnectMarketplaceScreen.tsx` (OAuth flow UI)
  - Updated `apps/api/src/index.ts`:
    - `POST /auth/marketplace/facebook` (OAuth redirect)
    - `GET /auth/marketplace/facebook/callback` (OAuth callback)
    - `POST /posts/:vehicleId/marketplace` (create post)
    - `GET /posts/:vehicleId` (view post)
    - `DELETE /posts/:postId` (delete post)
**Status:** To Do  
**Notes:** 
- Uses FB Graph API v19.0
- OAuth scopes: `marketplace_management`, `pages_manage_metadata`, `pages_read_engagement`
- Stores Facebook User ID + PSID (Page-Scoped ID) for future retargeting
- Posts are tied to dealer's personal account (not app-managed)

---

### Slice 13 — Claude AI Listing Generator
**Goal:** Generate platform-optimized listing copy + photo ranking.  
**Deliverables:**
- Prompt engineering for automotive listings
- Claude API integration (streaming for UX)
- Listing variations: Facebook-optimized, Craigslist-optimized, markdown, plaintext
- Photo ranking: AI selects best shots (quality, angle, lighting)
- SEO keywords: automatic keyword generation
**DoD:**
- Mobile: tap "Generate Listing" → AI writes copy in 2–3 seconds
- Multiple variations displayed (user picks best)
- Photos ranked and ordered
**Test Evidence:**
- `cd apps/api && node test-slice13.js`
  - ✓ Claude API integration working
  - ✓ Generates Facebook-specific copy (short, engaging, CTA)
  - ✓ Generates Craigslist copy (detailed specs, warranty info)
  - ✓ Photo ranking (returns ordered indices by quality)
  - ✓ SEO keywords (returns 8–12 keywords)
  - ✓ Streaming response to mobile (real-time generation)
  - ✓ Cost tracking (tokens used per generation)
- Files created:
  - `apps/api/src/ai/claudeClient.ts` (Anthropic API wrapper + streaming)
  - `apps/api/src/ai/listingPrompts.ts` (Platform-specific prompts)
  - `apps/api/src/listings.ts` (Enhanced Listing model + generation)
  - Updated `apps/mobile/src/screens/ListingExportScreen.tsx` (add "AI Generate" button)
  - New API endpoints:
    - `POST /listings/:vehicleId/generate` (generate variations)
    - `POST /listings/:vehicleId/generate/stream` (streaming response)
    - `GET /listings/:vehicleId` (get generated listing)
**Status:** To Do  
**Notes:**
- Anthropic API key stored in env
- Prompt includes: vehicle specs, dealer info, market context, platform guidelines
- Generates 3 variations per platform (user picks best or manually edits)
- Cost: ~200–400 tokens per vehicle (~$0.01–0.02 per generation)
- Caches results to avoid regenerating same vehicle multiple times

---

### Slice 14 — Scheduling Engine
**Goal:** Post vehicles at optimal times without manual intervention.  
**Deliverables:**
- Job queue (Bull + Redis)
- Scheduler: daily, weekly, smart (peak engagement times)
- Dealer can set: "Post this vehicle tomorrow at 9 AM" or "Auto-post 3 times per week"
- Post failure retry logic
- Rescheduling for un-sold vehicles
**DoD:**
- Schedule vehicle post → automatically posts at scheduled time
- Failed post retries 3x automatically
- Un-sold vehicles re-posted weekly
**Test Evidence:**
- `cd apps/api && node test-slice14.js`
  - ✓ Job queue initialized (Bull)
  - ✓ Schedule one-time post (specific time)
  - ✓ Schedule recurring post (daily/weekly)
  - ✓ Post job processes at correct time
  - ✓ Failed post retries (exponential backoff: 5min, 15min, 1hr)
  - ✓ Un-sold inventory auto-reposted on schedule
  - ✓ Job status tracking (pending, processing, success, failed)
- Files created:
  - `apps/api/src/queue/jobQueue.ts` (Bull job queue setup)
  - `apps/api/src/queue/processors.ts` (Post, retry, repost handlers)
  - `apps/api/src/postScheduler.ts` (Scheduling logic + cron)
  - Updated `apps/api/src/posts.ts` (PostJob model with schedule)
  - New API endpoints:
    - `POST /posts/:vehicleId/schedule` (schedule post)
    - `PUT /posts/:postId/schedule` (modify schedule)
    - `DELETE /posts/:postId/schedule` (cancel scheduled post)
    - `GET /posts/scheduler/status` (view all scheduled jobs)
**Status:** To Do  
**Notes:**
- Uses Bull (Redis-based job queue)
- Intelligent timing: analyze past engagement, post at peak hours
- Retry strategy: 5 minutes → 15 minutes → 1 hour → give up
- Un-sold vehicles: auto-repost weekly with updated AI copy
- Dealer dashboard shows: upcoming posts, past successes, failed attempts

---

### Slice 15 — Analytics + Performance Tracking
**Goal:** Measure every post (views, leads, conversions).  
**Deliverables:**
- Polling metrics from Facebook Marketplace API (daily)
- Lead tracking: clicks, messages, phone calls (FB integration)
- Dealer dashboard: ROI per vehicle, ROI per platform, best posting times
- Feedback loop: AI learns what works (copy style, photos, timing)
**DoD:**
- Dealer sees: "This Honda Civic got 47 views, 3 leads, sold in 5 days"
- Dashboard shows: "Post cars 9–11 AM on Tue/Thu for max engagement"
**Test Evidence:**
- `cd apps/api && node test-slice15.js`
  - ✓ Fetch metrics from FB Marketplace API (impressions, clicks)
  - ✓ Track lead events (message, phone call)
  - ✓ Calculate conversion rate (views → sold)
  - ✓ Aggregate metrics by vehicle, platform, date range
  - ✓ Generate insights (best posting time, best vehicle attributes)
  - ✓ Store metrics time-series for trend analysis
- Files created:
  - `apps/api/src/analytics/metricsCollector.ts` (FB API polling)
  - `apps/api/src/analytics/insights.ts` (Aggregation + recommendations)
  - `apps/api/src/postingMetrics.ts` (PostingMetrics model)
  - Updated `apps/api/src/queue/processors.ts` (add metrics polling job)
  - New API endpoints:
    - `GET /analytics/metrics/:vehicleId` (performance for one vehicle)
    - `GET /analytics/platform/:dealerId` (aggregate across all vehicles)
    - `GET /analytics/insights/:dealerId` (AI-generated recommendations)
    - `GET /analytics/trending` (what's selling fastest)
**Status:** To Do  
**Notes:**
- Polls FB Marketplace API daily (incremental)
- Tracks: impressions, clicks, messages, phone inquiries
- Calculates: CTR, conversion rate, days-to-sell, ROI per post
- ML-ready: feeds insights back into Claude for better prompts
- Dashboards: mobile view + detailed analytics in web

---

### Slice 16 — Multi-Platform Expansion
**Goal:** Extend beyond Facebook to Craigslist, Instagram, TikTok (dealer's own account).  
**Deliverables:**
- Craigslist adapter (API or web automation)
- Instagram/TikTok video generation (short clips from listing photos + AI narration)
- Unified posting interface: dealer selects platforms → auto-distributes
- Cross-platform analytics aggregation
**DoD:**
- One click → post appears on Facebook + Craigslist + Instagram simultaneously
- Analytics show combined metrics
**Test Evidence:**
- `cd apps/api && node test-slice16.js`
  - ✓ Craigslist post creation (API or automation)
  - ✓ Instagram Reels generation (video from photos)
  - ✓ TikTok video generation (short-form video)
  - ✓ Multi-platform scheduling (all platforms same time)
  - ✓ Unified metrics dashboard (views/leads across all platforms)
- Files created:
  - `apps/api/src/platforms/CraigslistAdapter.ts`
  - `apps/api/src/platforms/InstagramReels.ts` (video generation)
  - `apps/api/src/platforms/TikTokShorts.ts` (video generation)
  - Updated `apps/api/src/posts.ts` (multi-platform support)
  - New API endpoints:
    - `POST /posts/:vehicleId/distribute` (post to selected platforms)
    - `GET /posts/:vehicleId/platforms` (view post across platforms)
**Status:** To Do  
**Notes:**
- Craigslist: evaluate official API availability (may require web automation)
- Video generation: use FFmpeg + AI narration (optional for MVP)
- Focus: start with Craigslist (biggest used-car audience after FB)
- Defer video until validated with text-based platforms

---

## Implementation Plan

### Phase 1 (Weeks 1–2): Foundation
- [ ] Slice 12: Facebook Marketplace OAuth + posting
- [ ] Slice 13: Claude integration + listing generation

### Phase 2 (Weeks 3–4): Automation
- [ ] Slice 14: Job queue + scheduling
- [ ] Slice 15: Metrics collection + analytics

### Phase 3 (Weeks 5–6): Scale
- [ ] Slice 16: Craigslist + multi-platform
- [ ] Polish + production hardening

---

## Tech Stack (V2 Additions)
- **Job Queue:** Bull (Redis-backed)
- **Cron Scheduler:** node-cron or built into Bull
- **AI:** Anthropic Claude API (claude-3-sonnet)
- **Social APIs:** Facebook Graph API, Craigslist API (if available)
- **Metrics:** Time-series storage (same DB or TimescaleDB add-on)
- **Video (future):** FFmpeg + OpenAI Audio API for narration

---

## Success Metrics (V2)
- Dealers post 5x more listings (automation, not manual)
- Average days-to-sell reduced by 30% (optimal timing + copy)
- AI-generated listings have 15% higher CTR than manual
- Scheduling eliminates 80% of manual posting work
- Analytics reveal clear patterns (best times, best descriptions, best photos)

---

## Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| FB Graph API rate limits | Implement caching + batch operations |
| Claude cost explosion | Set usage limits + cache prompts |
| Job queue reliability | Use persistent queue (Redis) + dead-letter handling |
| Metrics data accuracy | Poll daily, validate with FB API, reconcile gaps |
| Platform API changes | Abstract platform logic (SliceAdapterFactory pattern) |

---

## Notes
- V1 remains stable and unchanged (backward compatible)
- All V2 features are dealer-opt-in (settings toggle)
- Defaults are conservative (no auto-post without explicit permission)
- Privacy: no dealer data leaves system except to their own connected platforms
