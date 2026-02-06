#!/bin/bash

# Shiftly Auto Tool - API Authentication Setup Script
# This script sets up and starts the authentication API

set -e  # Exit on error

echo "🚀 Setting up Shiftly Auth API..."

# Navigate to API directory
cd "$(dirname "$0")/apps/api"

# Check if PostgreSQL is running
echo "📦 Checking PostgreSQL..."
if ! pg_isready -q; then
  echo "⚠️  PostgreSQL not running. Starting..."
  brew services start postgresql@17
  sleep 3
fi

# Check if database exists
echo "🗄️  Checking database..."
if ! psql -lqt | cut -d \| -f 1 | grep -qw shiftly_v3; then
  echo "⚠️  Database shiftly_v3 not found. Creating..."
  psql postgres -c "CREATE DATABASE shiftly_v3;"
  psql shiftly_v3 -c "GRANT ALL PRIVILEGES ON SCHEMA public TO $(whoami);"
fi

# Grant permissions
echo "🔐 Setting database permissions..."
psql shiftly_v3 -c "GRANT ALL PRIVILEGES ON SCHEMA public TO $(whoami);" > /dev/null 2>&1
psql shiftly_v3 -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $(whoami);" > /dev/null 2>&1
psql shiftly_v3 -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $(whoami);" > /dev/null 2>&1

# Check if .env exists
if [ ! -f .env ]; then
  echo "⚠️  .env file not found. Creating..."
  cat > .env << EOF
DATABASE_URL="postgresql://$(whoami)@localhost/shiftly_v3"
NODE_ENV="development"
PORT="3001"
JWT_SECRET="dev-secret-key"
JWT_EXPIRY="7d"
EOF
fi

# Install dependencies
echo "📥 Installing dependencies..."
pnpm install --silent

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate > /dev/null 2>&1

# Build TypeScript
echo "🏗️  Building TypeScript..."
npx tsc

# Check if tables exist, create if not
echo "🗃️  Checking database schema..."
TABLE_COUNT=$(psql shiftly_v3 -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('Dealership','User','Vehicle','Listing','Post','PostMetric','RefreshToken');")

if [ "$TABLE_COUNT" -lt "7" ]; then
  echo "⚠️  Tables missing. Creating from schema.sql..."
  psql shiftly_v3 -f prisma/schema.sql > /dev/null 2>&1
  echo "✅ Tables created"
fi

# Kill any existing API process
echo "🔄 Stopping existing API..."
pkill -f "node dist/index.js" 2>/dev/null || true
sleep 1

# Start API server
echo "▶️  Starting API server..."
node dist/index.js > /dev/null 2>&1 &
API_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 3

# Health check
if curl -s http://localhost:3001/health > /dev/null; then
  echo ""
  echo "✅ API server started successfully!"
  echo ""
  echo "📍 API URL: http://localhost:3001"
  echo "💚 Health: http://localhost:3001/health"
  echo ""
  echo "🔐 Auth Endpoints:"
  echo "  POST /auth/v2/signup/dealership - Create dealership"
  echo "  POST /auth/v2/login - Login"
  echo "  POST /auth/v2/refresh - Refresh token"
  echo "  POST /auth/v2/verify - Verify token"
  echo ""
  echo "🛑 To stop: pkill -f 'node dist/index.js'"
  echo ""
else
  echo "❌ Server failed to start"
  exit 1
fi
