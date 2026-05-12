# BharatKit Railway Deployment Script
# Run this after: railway login

Write-Host "🚀 Deploying BharatKit to Railway..." -ForegroundColor Cyan

# Create new Railway project
Write-Host "📦 Creating Railway project..." -ForegroundColor Yellow
railway init --name bharatkit

# Add PostgreSQL database
Write-Host "🗄️  Adding PostgreSQL..." -ForegroundColor Yellow
railway add --plugin postgresql

# Add Redis
Write-Host "⚡ Adding Redis..." -ForegroundColor Yellow
railway add --plugin redis

# Set environment variables
Write-Host "🔐 Setting environment variables..." -ForegroundColor Yellow
railway variables set `
  NODE_ENV=production `
  JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" `
  RAZORPAY_KEY_ID="rzp_test_placeholder" `
  RAZORPAY_KEY_SECRET="placeholder_secret" `
  UIDAI_API_URL="https://api.uidai.gov.in" `
  UIDAI_API_KEY="sandbox_key" `
  GST_API_URL="https://api.gst.gov.in" `
  GST_API_KEY="sandbox_key" `
  DIGILOCKER_CLIENT_ID="sandbox_client_id" `
  DIGILOCKER_CLIENT_SECRET="sandbox_client_secret" `
  ACCOUNT_AGGREGATOR_URL="https://api.accountaggregator.org.in" `
  ACCOUNT_AGGREGATOR_KEY="sandbox_key"

# Deploy
Write-Host "🚀 Deploying..." -ForegroundColor Yellow
railway up --detach

# Get the URL
Write-Host "🌐 Getting deployment URL..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
railway domain

Write-Host "✅ Deployment complete!" -ForegroundColor Green
