-- Create tables directly with raw SQL
CREATE TABLE IF NOT EXISTS "Dealership" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "apiKey" TEXT NOT NULL UNIQUE,
  "subscriptionTier" TEXT NOT NULL DEFAULT 'basic',
  "monthlyPostLimit" INTEGER NOT NULL DEFAULT 500,
  "stripeCustomerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Dealership_apiKey_idx" ON "Dealership"("apiKey");

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "dealershipId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT,
  "name" TEXT NOT NULL,
  "facebookId" TEXT,
  "facebookAccessToken" TEXT,
  "facebookPageId" TEXT,
  "facebookPageName" TEXT,
  "role" TEXT NOT NULL DEFAULT 'salesperson',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership" ("id") ON DELETE CASCADE,
  UNIQUE("dealershipId", "email")
);

CREATE INDEX IF NOT EXISTS "User_dealershipId_idx" ON "User"("dealershipId");
CREATE INDEX IF NOT EXISTS "User_facebookId_idx" ON "User"("facebookId");

CREATE TABLE IF NOT EXISTS "RefreshToken" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "RefreshToken_userId_idx" ON "RefreshToken"("userId");

CREATE TABLE IF NOT EXISTS "Vehicle" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "dealershipId" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "make" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "trim" TEXT,
  "vin" TEXT UNIQUE,
  "mileage" INTEGER NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "color" TEXT,
  "status" TEXT NOT NULL DEFAULT 'available',
  "photos" TEXT[],
  "processedPhotos" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Vehicle_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Vehicle_dealershipId_idx" ON "Vehicle"("dealershipId");
CREATE INDEX IF NOT EXISTS "Vehicle_status_idx" ON "Vehicle"("status");

CREATE TABLE IF NOT EXISTS "Listing" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "dealershipId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "highlights" TEXT[],
  "facebookTitle" TEXT,
  "facebookDesc" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Listing_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership" ("id") ON DELETE CASCADE,
  CONSTRAINT "Listing_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Listing_dealershipId_idx" ON "Listing"("dealershipId");
CREATE INDEX IF NOT EXISTS "Listing_vehicleId_idx" ON "Listing"("vehicleId");

CREATE TABLE IF NOT EXISTS "Post" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "dealershipId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "platform" TEXT NOT NULL DEFAULT 'facebook_marketplace',
  "facebookPostId" TEXT UNIQUE,
  "status" TEXT NOT NULL DEFAULT 'scheduled',
  "scheduledFor" TIMESTAMP(3),
  "postedAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Post_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership" ("id") ON DELETE CASCADE,
  CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE,
  CONSTRAINT "Post_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE,
  CONSTRAINT "Post_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Post_dealershipId_idx" ON "Post"("dealershipId");
CREATE INDEX IF NOT EXISTS "Post_userId_idx" ON "Post"("userId");
CREATE INDEX IF NOT EXISTS "Post_status_idx" ON "Post"("status");
CREATE INDEX IF NOT EXISTS "Post_postedAt_idx" ON "Post"("postedAt");

CREATE TABLE IF NOT EXISTS "PostMetric" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "postId" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL,
  "views" INTEGER NOT NULL DEFAULT 0,
  "saves" INTEGER NOT NULL DEFAULT 0,
  "inquiries" INTEGER NOT NULL DEFAULT 0,
  "clickThroughs" INTEGER NOT NULL DEFAULT 0,
  "timeToFirstInquiry" INTEGER,
  "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PostMetric_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE,
  CONSTRAINT "PostMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "PostMetric_userId_idx" ON "PostMetric"("userId");
