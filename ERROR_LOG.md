# Error Log — Shiftly Auto Tool

## Rules
- Every error gets an entry (no exceptions).
- Include: exact message, root cause, fix, and verification command.
- Link to the commit/PR that fixed it.

---

## Template (copy per issue)
### [YYYY-MM-DD] <short title>
**Context:** (what you were trying to do)  
**Error message (verbatim):**
```
<exact error text>
```
**Root cause:**  
- 

**Fix applied:**  
1)  
2)  

**Verification:**  
- Command(s):
  - 
- Expected result:
  - 

**Prevention (optional):**  
- 

**Commit/PR:**  
- <link>

---

## Entries

### [2026-01-26] apps/api directory missing
**Context:** Setting up backend skeleton (Slice 2); ran `pnpm -C apps/api prisma generate`  
**Error message (verbatim):**
```
ERROR  ENOENT: no such file or directory, lstat '/Users/brandonsandoval/PONS-Auto/apps/api'
```
**Root cause:** `apps/api` scaffold does not exist yet; only `apps/mobile` is present.  
**Fix:** Create `apps/api` with Express + TypeScript boilerplate in Slice 2.  
**Verification:**
```bash
pnpm -C apps/api dev
curl http://localhost:3001/health
# Expected: 200 OK
```

---

### [2026-01-26] react-native-web not installed
**Context:** Running `pnpm -C apps/mobile start --web` to start web dev server (Slice 1)  
**Error message (verbatim):**
```
CommandError: It looks like you're trying to use web support but don't have the required dependencies installed.
```
**Root cause:** Web dependencies not included in Expo setup initially.  
**Fix:** 
```bash
npx expo install react-native-web
```
**Verification:**
```bash
pnpm -C apps/mobile start --web
# Expected: Metro compiles and web UI loads
```

---

### [2026-01-26] Metro/Watchman hang on web
**Context:** `pnpm -C apps/mobile start --web` hangs or process stuck  
**Error message (verbatim):**
```
(Watchman/Metro process stuck or not responding)
```
**Root cause:**  
- Watchman/Metro file watcher stuck or not installed

**Fix applied:**  
1) Disabled watchman or restarted watcher  
2) Cleared cache  

**Verification:**  
- Command(s):
  - `npx expo start -c --web`
- Expected result:
  - Web loads "Open up App.tsx…"

**Prevention (optional):**  
- Run cleanup on startup: `watchman shutdown-server || true && watchman watch-del-all || true && pkill -f "metro" || true`

**Commit/PR:**  
- <add link>

---

### [2026-01-26] @types/cors missing
**Context:** Building API (`pnpm -C apps/api build`) for Slice 2  
**Error message (verbatim):**
```
error TS7016: Could not find a declaration file for module 'cors'
```
**Root cause:**  
- @types/cors not in devDependencies despite cors being used

**Fix applied:**  
1) Ran `pnpm -C apps/api add -D @types/cors`  
2) Rebuilt with `pnpm -C apps/api build` → success  

**Verification:**  
- Command(s):
  - `pnpm -C apps/api build`
- Expected result:
  - No TypeScript errors, dist/ folder generated

**Prevention (optional):**  
- Always add @types/* packages for npm modules with TypeScript usage

**Commit/PR:**  
- Included in Slice 2 commit
