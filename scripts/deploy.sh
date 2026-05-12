#!/bin/bash
# ============================================================
# BharatKit Deployment Script
# Run on your VPS: bash scripts/deploy.sh
# ============================================================

set -e  # Exit on any error

echo "🚀 BharatKit Deployment Starting..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check .env exists
if [ ! -f ".env" ]; then
  echo -e "${RED}❌ .env file not found. Copy .env.example to .env and fill in values.${NC}"
  exit 1
fi

# Check required env vars
required_vars=("DATABASE_URL" "JWT_SECRET" "RAZORPAY_KEY_ID" "RAZORPAY_KEY_SECRET")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    source .env
    if [ -z "${!var}" ]; then
      echo -e "${RED}❌ Required env var $var is not set in .env${NC}"
      exit 1
    fi
  fi
done

echo -e "${GREEN}✅ Environment variables verified${NC}"

# Install dependencies
echo "📦 Installing backend dependencies..."
npm ci --only=production

echo "📦 Installing dashboard dependencies..."
cd dashboard && npm ci && cd ..

# Build dashboard
echo "🔨 Building React dashboard..."
cd dashboard && npm run build && cd ..
echo -e "${GREEN}✅ Dashboard built${NC}"

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate --schema=prisma/schema.prisma
echo -e "${GREEN}✅ Prisma client generated${NC}"

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy --schema=prisma/schema.prisma
echo -e "${GREEN}✅ Database migrations applied${NC}"

# Create logs directory
mkdir -p logs

echo ""
echo -e "${GREEN}✨ Deployment complete!${NC}"
echo ""
echo "Start the server with:"
echo "  NODE_ENV=production node src/server.js"
echo ""
echo "Or with PM2 (recommended):"
echo "  pm2 start src/server.js --name bharatkit --env production"
echo "  pm2 save"
echo "  pm2 startup"
