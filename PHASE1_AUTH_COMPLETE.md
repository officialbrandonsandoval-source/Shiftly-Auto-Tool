# Phase 1: Multi-Tenant Authentication - Implementation Summary

## ✅ What Was Built

### Backend (API)

#### 1. Database Schema (Prisma)
- **Dealership Model**: Top-level organization with subscription tiers
- **User Model**: Salespeople/team members with roles (admin, manager, salesperson)
- **Vehicle Model**: Vehicle inventory per dealership
- **Listing Model**: AI-generated content per vehicle
- **Post Model**: Marketplace posts with status tracking
- **PostMetric Model**: Analytics tracking per post
- **RefreshToken Model**: Token management

**Key Features:**
- Multi-tenant isolation (dealershipId on all tables)
- Role-based access control (admin/manager/salesperson)
- Facebook OAuth fields for per-user posting
- Built-in analytics structure

#### 2. Authentication Service (`src/auth/tokenService.ts`)
- Password hashing with bcrypt
- JWT token generation and verification
- Token refresh mechanism
- User data conversion to safe DTOs

**Functions:**
- `hashPassword()` - Secure password hashing
- `verifyPassword()` - Compare passwords
- `createAccessToken()` - Create JWT access token (7d expiry)
- `createRefreshToken()` - Create refresh token (30d expiry)
- `verifyToken()` - Validate and decode JWT
- `createAuthResponse()` - Package user + tokens

#### 3. Authentication Routes (`src/auth/authRoutes.ts`)

**Endpoints:**
- `POST /auth/v2/signup/dealership` - Create new dealership + admin user
- `POST /auth/v2/login` - Login with email/password
- `POST /auth/v2/invite-user` - Invite new team member (requires API key)
- `POST /auth/v2/refresh` - Refresh access token
- `POST /auth/v2/verify` - Verify token validity

**API Key Middleware:**
- Validates dealership API key from `X-API-Key` header
- Enables backend-to-backend requests for invitations

#### 4. Environment Configuration
- `.env.local` with DATABASE_URL, JWT_SECRET, Facebook OAuth config
- Express integration with new `/auth/v2` routes
- Backward compatibility with v1 auth routes

### Mobile App

#### 1. Authentication Client (`src/api/authClient.ts`)

**Exported Functions:**
- `signupDealership()` - Create new dealership account
- `login()` - Login with credentials
- `refreshAccessToken()` - Auto-refresh tokens
- `logout()` - Clear all auth data
- `getAccessToken()` - Get current token
- `getCurrentUser()` - Get logged-in user
- `isLoggedIn()` - Check auth status

**Storage:**
- Uses AsyncStorage for persistent tokens
- Stores: accessToken, refreshToken, user data
- Auto-refresh on token expiry

#### 2. Login Screen (`src/screens/LoginScreen.tsx`)
- Email/password login form
- Loading states
- Error handling with alerts
- Link to signup screen
- Clean UI with Tailwind-like styling

#### 3. Signup Screen (`src/screens/SignupScreen.tsx`)
- Dealership name input
- User name input
- Email input
- Password validation (min 8 chars)
- Password confirmation
- Error messages for form validation
- Link back to login

#### 4. Navigation Integration
- Modified `App.tsx` for auth flow
- Conditional navigation: Auth Stack vs App Stack
- Auto-login check on app load
- Smooth screen transitions

#### 5. Dependencies Added
- `@react-native-async-storage/async-storage` v1.21.0 - Token storage

### Backend Dependencies Added
- `bcrypt` v5.1.1 - Password hashing
- `@types/bcrypt` v5.0.2 - TypeScript types

---

## 🚀 How to Use

### Step 1: Set Up PostgreSQL

```bash
# macOS with Homebrew
brew install postgresql@15
brew services start postgresql@15

# Or use Docker
docker run --name postgres -e POSTGRES_PASSWORD=password -d postgres:15
```

### Step 2: Configure Database

Edit `apps/api/.env.local`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/shiftly_v3"
JWT_SECRET="your-secure-key-here"
JWT_EXPIRY="7d"
PORT="3001"
```

### Step 3: Run Database Migrations

```bash
cd apps/api
pnpm exec prisma migrate dev --name "init_multi_tenant_auth"
```

### Step 4: Start Backend

```bash
cd apps/api
pnpm start
```

The API will be available at `http://localhost:3001`

### Step 5: Install Mobile Dependencies

```bash
cd apps/mobile
pnpm install
```

### Step 6: Start Mobile App

```bash
cd apps/mobile
pnpm start
```

Then:
- Press `i` for iOS Simulator, or
- Scan QR code with phone camera for physical device

### Step 7: Test the Flow

**Sign Up:**
1. Tap "Sign Up" on login screen
2. Fill in dealership name: "Test Dealer"
3. Fill in your name: "John Doe"
4. Email: "john@testdealer.com"
5. Password: "TestPass123!"
6. Tap "Create Account"

**Login:**
1. Use the credentials from signup
2. Email: "john@testdealer.com"
3. Password: "TestPass123!"

---

## 📊 Database Schema Overview

```
Dealership (1)
├── users (Many) → User
│   └── posts (Many) → Post
│   └── metrics (Many) → PostMetric
├── vehicles (Many) → Vehicle
│   └── listings (Many) → Listing
│   └── posts (Many) → Post
└── listings (Many) → Listing
    └── posts (Many) → Post

Post (1)
├── metrics (1) → PostMetric
├── dealership (M) → Dealership
├── user (M) → User
├── vehicle (M) → Vehicle
└── listing (M) → Listing
```

---

## 🔐 API Key System

### Dealership API Key
- Generated automatically on dealership creation
- Stored in `dealership.apiKey`
- Used for backend-to-backend requests
- Passed via `X-API-Key` header

**Example - Invite User:**
```bash
curl -X POST http://localhost:3001/auth/v2/invite-user \
  -H "X-API-Key: your-dealership-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "salesman@dealer.com",
    "name": "Sales Rep",
    "role": "salesperson"
  }'
```

---

## 📱 Mobile Auth Flow

1. **App Loads**
   - Check if user is logged in (AsyncStorage check)
   - If not: Show Login/Signup screens
   - If yes: Show App Stack with inventory

2. **Sign Up**
   - Create dealership + admin user in one request
   - Receive accessToken + refreshToken
   - Store tokens in AsyncStorage
   - Auto-navigate to App

3. **Login**
   - Send email + password
   - Receive accessToken + refreshToken
   - Store tokens in AsyncStorage
   - Auto-navigate to App

4. **Token Refresh**
   - AccessToken expires in 7 days
   - Before expiry: Use refreshToken to get new accessToken
   - RefreshToken expires in 30 days

5. **Logout**
   - Clear all tokens and user data
   - Show Login screen again

---

## 🔄 Token Architecture

### Access Token (JWT)
```json
{
  "userId": "cuid...",
  "dealershipId": "cuid...",
  "email": "user@dealer.com",
  "role": "salesperson",
  "iat": 1234567890,
  "exp": 1241180290  // 7 days from issue
}
```

### Refresh Token (JWT)
```json
{
  "userId": "cuid...",
  "iat": 1234567890,
  "exp": 1248246290  // 30 days from issue
}
```

---

## 🎯 What's Next

### Phase 2: Salesman Analytics (Week 3)
- [ ] Build PostMetric collection from Facebook API
- [ ] Create leaderboard endpoints
- [ ] Add LeaderboardScreen to mobile UI
- [ ] Implement daily metric sync job

### Phase 3: AI Background Generator (Week 4-5)
- [ ] Integrate Remove.bg API
- [ ] Set up Stable Diffusion
- [ ] Build image processing pipeline
- [ ] Add to listing workflow

### Phase 4: Facebook OAuth (Week 6)
- [ ] Implement Facebook OAuth flow
- [ ] Store per-user access tokens
- [ ] Update posting to use user's Facebook token

---

## ⚠️ Important Notes

### Development
- Database URL in `.env.local` is for local development
- Change JWT_SECRET in production
- API runs on port 3001

### Deployment
- Set DATABASE_URL environment variable on Render
- Update API_BASE_URL in mobile to production URL
- Use strong JWT_SECRET in production

### Security
- Passwords are hashed with bcrypt (salt rounds: 10)
- Tokens are signed with JWT_SECRET
- Never commit `.env.local` with real secrets
- API key should be treated like password

---

## 📝 Files Created/Modified

### New Files
```
apps/api/
├── prisma/schema.prisma (updated)
├── .env.local (new)
├── src/auth/tokenService.ts (new)
├── src/auth/authRoutes.ts (new)
├── src/types/express.d.ts (new)
└── setup.sh (new)

apps/mobile/
├── src/api/authClient.ts (new)
├── src/screens/LoginScreen.tsx (new)
├── src/screens/SignupScreen.tsx (new)
└── App.tsx (updated)
```

### Updated Files
```
apps/api/
├── src/index.ts (integrated auth routes)
└── package.json (added bcrypt)

apps/mobile/
└── package.json (added @react-native-async-storage/async-storage)
```

---

## ✨ Key Features Implemented

✅ Multi-tenant dealership model
✅ User management with roles
✅ Secure password hashing
✅ JWT token authentication
✅ Token refresh mechanism
✅ API key for backend requests
✅ Mobile login/signup screens
✅ Persistent authentication (AsyncStorage)
✅ Conditional navigation based on auth
✅ Error handling and validation
✅ Auto-logout on token expiry

---

**Status: Phase 1 Complete** ✅

Ready for:
- Database setup on your machine
- Testing login/signup flow
- Integration with existing API features
