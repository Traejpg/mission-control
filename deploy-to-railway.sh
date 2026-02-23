#!/bin/bash
# Deploy Mission Control to Cloud (Railway)
# Usage: ./deploy-to-railway.sh

set -e

echo "🚀 Mission Control Cloud Deployment"
echo "===================================="
echo ""

# Check for Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check login status
echo "🔑 Checking Railway login..."
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway:"
    railway login
fi

# Build frontend
echo "📦 Building frontend..."
npm run build

# Deploy to Netlify (frontend is already deployed)
echo "☁️  Frontend already deployed to Netlify"
echo "   URL: https://mission-control-tee.netlify.app"
echo ""

# Initialize Railway project if not exists
if [ ! -f .railway/config.json ]; then
    echo "🚂 Initializing Railway project..."
    railway init --name mission-control-backend
fi

# Deploy backend
echo "🚂 Deploying backend to Railway..."
railway up

# Get the public URL
echo ""
echo "🔗 Getting public URL..."
RAILWAY_URL=$(railway domain)
echo "Backend URL: $RAILWAY_URL"

# Update environment variables
echo ""
echo "📝 Updating environment configuration..."
cat > .env.production << EOF
# Cloud Deployment URLs
VITE_GATEWAY_URL=wss://$RAILWAY_URL
VITE_WATCHER_URL=wss://$RAILWAY_URL/ws
EOF

echo ""
echo "✅ Backend deployed!"
echo ""
echo "📝 Next steps:"
echo "1. Update .env.production with your Railway URL: $RAILWAY_URL"
echo "2. Rebuild frontend: npm run build"
echo "3. Redeploy frontend to Netlify"
echo ""
echo "Your Mission Control will be accessible from anywhere!"
echo "Frontend: https://mission-control-tee.netlify.app"
echo "Backend: wss://$RAILWAY_URL"
