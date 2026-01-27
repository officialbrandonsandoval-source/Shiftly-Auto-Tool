# PONS Auto — Mobile-First Inventory Platform (iOS/Android/Web)

## North Star
Ship an MVP that **100% works with dealer inventory feeds** and delivers a **mobile-first listing workflow** across **iOS, Android, and Web** from a **single monorepo**.

## Repo
- Single monorepo: `PONS-Auto`
- Apps:
  - `apps/mobile` (Expo + Tamagui: iOS/Android/Web)
  - `apps/api` (Render backend API + worker)
- Shared:
  - `packages/shared` (types + schemas)

---

## How to use this doc (rules)
1. Every time a slice is completed:
   - Run the slice tests (defined below)
   - Update **Slice Status** + **Test Evidence**
   - Push to GitHub (PR preferred)
2. Every time you hit an error:
   - Log it in `ERROR_LOG.md` using the template
   - Include the fix + verification command(s)

---

## Milestones (timeline gates)
### Gate A — Cross-platform shell
- Mobile app runs on iOS/Android/Web
- Web loads without dependency/watcher issues

### Gate B — Backend online
- `apps/api` deployed (Render) and `/health` returns 200

### Gate C — Inventory end-to-end
- Provider connection stored securely server-side
- Sync imports vehicles into DB
- Mobile shows inventory list + detail from real API

### Gate D — Wedge feature shipped
- Listing Package generator + export works on:
  - iOS/Android: share sheet
  - Web: copy + download

---

## Slices (execution plan)

### Slice 0 — Monorepo foundation ✅
**Goal:** Real monorepo with consistent commands.  
**Deliverables:**
- `pnpm-workspace.yaml` includes `apps/*` + `packages/*`
- Root scripts for `dev:mobile:web`, `dev:api`
- `.gitignore` blocks `.env*`
**DoD:**
- `pnpm i` succeeds at repo root
**Test Evidence:**
- Command(s):
  - `pnpm -v`
  - `pnpm i`

**Status:** ✅ Done  
**Last updated:** 2026-01-26  
**Owner:** Brandon  
**Notes:** Dependencies already installed, workspace configured correctly.

---

### Slice 1 — Mobile web stable ✅
**Goal:** Web build works reliably (watchman issues resolved).  
**Deliverables:**
- `react-native-web` + `react-dom` installed via Expo
- Metro runs and loads web UI
**DoD:**
- `pnpm -C apps/mobile start --web` launches and loads page
**Test Evidence:**
- Command(s):
  - `pnpm -C apps/mobile start --web`
- Result:
  - Web server starts and app loads

**Status:** ✅ Done  
**Last updated:** 2026-01-26  
**Owner:** Brandon  
**Notes:** react-native-web installed. Metro server runs successfully. Watchman cleanup commands work.

---

### Slice 2 — Backend skeleton (apps/api) ⬜
**Goal:** API exists locally + deployable.  
**Deliverables:**
- `apps/api` with Express + TS
- `/health` endpoint
- `render.yaml` (at root or `apps/api/render.yaml`)
**DoD:**
- Local: `pnpm -C apps/api dev` + `GET /health` is 200
**Test Evidence:**
- Command(s):
  - `pnpm -C apps/api dev`
  - `curl http://localhost:3001/health`

**Status:** ⬜ Not started  
**Last updated:** YYYY-MM-DD  
**Owner:** Brandon  
**Blocked by:** None

---

### Slice 3 — Auth (JWT) ⬜
**Goal:** Secure user sessions.  
**Deliverables:**
- `POST /auth/login`
- `GET /me`
- JWT middleware
**DoD:**
- Mobile logs in and calls `/me`
**Test Evidence:**
- Command(s):
  - `curl -X POST ... /auth/login`
  - `curl -H "Authorization: Bearer <token>" ... /me`

**Status:** ⬜ Not started  
**Last updated:** YYYY-MM-DD  
**Owner:** Brandon  
**Blocked by:** Slice 2

---

### Slice 4 — API keys (hash-only) ⬜
**Goal:** Server-issued keys for integrations/admin use (not mobile required).  
**Deliverables:**
- Create/list/revoke API keys
- Hash storage only; plaintext shown once
**DoD:**
- Revoked key fails immediately
**Test Evidence:**
- Command(s):
  - `curl -X POST ... /api-keys`
  - `curl -H "X-API-Key: ..." ... /vehicles`

**Status:** ⬜ Not started  
**Last updated:** YYYY-MM-DD  
**Owner:** Brandon  
**Blocked by:** Slice 2

---

### Slice 5 — Provider credential vault (encrypted) ⬜
**Goal:** Provider creds stored only server-side, encrypted at rest.  
**Deliverables:**
- AES-256-GCM encrypt/decrypt utilities
- `ProviderConnection` model storing `{ciphertext, iv, tag}`
- Connect endpoint never returns secrets
**DoD:**
- Secrets never appear in logs or API responses
**Test Evidence:**
- Verify response redaction + DB fields are ciphertext

**Status:** ⬜ Not started  
**Last updated:** YYYY-MM-DD  
**Owner:** Brandon  
**Blocked by:** Slice 2

---

### Slice 6 — Provider adapters + MockProvider ⬜
**Goal:** Unblock UI and pipeline independent of provider delays.  
**Deliverables:**
- Adapter interface
- MockProvider returns sample vehicles
- Sync job imports/upserts vehicles
**DoD:**
- Sync is idempotent (run twice, no duplicates)
**Test Evidence:**
- Command(s):
  - `pnpm -C apps/api dev`
  - `curl -X POST ... /providers/mock/sync`

**Status:** ⬜ Not started  
**Last updated:** YYYY-MM-DD  
**Owner:** Brandon  
**Blocked by:** Slice 2

---

### Slice 7 — Inventory API ⬜
**Goal:** Fast list/detail endpoints for app.  
**Deliverables:**
- `GET /vehicles` (pagination/search/updatedSince)
- `GET /vehicles/:id`
- Indexes for performance
**DoD:**
- List+search stable
**Test Evidence:**
- Command(s):
  - `curl ".../vehicles?query=toyota&page=1"`

**Status:** ⬜ Not started  
**Last updated:** YYYY-MM-DD  
**Owner:** Brandon  
**Blocked by:** Slice 2, 6

---

### Slice 8 — Inventory UI (Expo + Tamagui) ⬜
**Goal:** iOS/Android/Web browse inventory cleanly.  
**Deliverables:**
- Inventory list + filters + detail screen
- Empty/loading/error states
**DoD:**
- Same screens work on phone + web
**Test Evidence:**
- Screenshot links or short note

**Status:** ⬜ Not started  
**Last updated:** YYYY-MM-DD  
**Owner:** Brandon  
**Blocked by:** Slice 7

---

### Slice 9 — Listing Package + export ⬜
**Goal:** The wedge: export-ready listing workflow.  
**Deliverables:**
- Package generator (title/desc/specs/photos)
- Export:
  - iOS/Android share sheet
  - Web copy + download
**DoD:**
- Dealer can post manually with minimal friction
**Test Evidence:**
- Commands + screenshots

**Status:** ⬜ Not started  
**Last updated:** YYYY-MM-DD  
**Owner:** Brandon  
**Blocked by:** Slice 8

---

### Slice 10 — Real provider integration ⬜
**Goal:** "100% works with dealer feed" for at least one dealer.  
**Deliverables:**
- Real adapter implemented
- Connection test + sync scheduled/triggered
**DoD:**
- Live dealer inventory visible in app
**Test Evidence:**
- Dealer orgId + sync log entry + vehicle count

**Status:** ⬜ Not started  
**Last updated:** YYYY-MM-DD  
**Owner:** Brandon  
**Blocked by:** Slice 6, 8

---

### Slice 11 — Diagnostics + reliability ⬜
**Goal:** No guessing when things fail.  
**Deliverables:**
- Sync logs endpoint + last sync status
- Correlation IDs
- Safe error messages
**DoD:**
- Diagnose missing inventory in <5 minutes
**Test Evidence:**
- Example failure + log trace

**Status:** ⬜ Not started  
**Last updated:** YYYY-MM-DD  
**Owner:** Brandon  
**Blocked by:** Slice 6

---

## Standard test checklist (run before marking a slice "Done")
- [ ] `pnpm i` at repo root
- [ ] Mobile web runs: `pnpm -C apps/mobile start --web`
- [ ] API health works: `curl http://localhost:3001/health`
- [ ] No secrets in repo: check `.env*` ignored and not committed
- [ ] Update `PROJECT.md` + `ERROR_LOG.md` (if any)
- [ ] Commit + push

---

## Progress Summary
- **Gates completed:** A (mobile web runs)
- **Slices completed:** 0, 1
- **Next focus:** Slice 2 (Backend skeleton)
