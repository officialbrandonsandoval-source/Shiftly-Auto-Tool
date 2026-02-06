#!/bin/bash
# Setup script for Phase 1 authentication

echo "📦 Installing dependencies..."
pnpm install

echo "🗄️  Setting up PostgreSQL database..."
echo "Note: Make sure PostgreSQL is running locally"
echo "You can start PostgreSQL with: brew services start postgresql"

echo "⚙️  Running Prisma migrations..."
pnpm exec prisma migrate dev --name "init_multi_tenant_auth"

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update .env.local with your database URL if needed"
echo "2. Test with: curl -X POST http://localhost:3001/auth/v2/signup/dealership -H 'Content-Type: application/json' -d '{\"dealershipName\":\"Test Dealer\",\"email\":\"admin@test.com\",\"password\":\"password123\",\"name\":\"Admin User\"}'"
