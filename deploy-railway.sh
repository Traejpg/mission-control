#!/bin/bash
# Railway Deployment Script for Mission Control Backend
# Run this after logging in with: railway login

set -e

echo "🚂 Mission Control Railway Deployment"
echo "====================================="
echo ""

# Check login
echo "🔑 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in. Please run: railway login"
    exit 1
fi
echo "✅ Authenticated"
echo ""

# Initialize project if needed
if [ ! -f .railway/config.json ]; then
    echo "🆕 Creating new Railway project..."
    railway init --name mission-control-backend
    echo "✅ Project created"
else
    echo "✅ Using existing Railway project"
fi
echo ""

# Deploy
echo "🚀 Deploying to Railway..."
railway up
echo ""

# Get URL
echo "🔗 Getting deployment URL..."
RAILWAY_URL=$(railway domain 2>/dev/null || echo "")

if [ -n "$RAILWAY_URL" ]; then
    echo "✅ Backend deployed!"
    echo ""
    echo "Backend URL: https://$RAILWAY_URL"
    echo "WebSocket: wss://$RAILWAY_URL/ws"
    echo ""
    echo "📝 Update your .env.production:"
    echo "VITE_GATEWAY_URL=wss://$RAILWAY_URL"
    echo "VITE_WATCHER_URL=wss://$RAILWAY_URL/ws"
    echo ""
    
    # Update .env.production
    cat > .env.production << EOF
# Production Environment Variables
# Railway backend URLs

VITE_GATEWAY_URL=wss://$RAILWAY_URL
VITE_WATCHER_URL=wss://$RAILWAY_URL/ws
EOF
    echo "✅ Updated .env.production"
else
    echo "⚠️ Could not get Railway URL automatically."
    echo "Check your Railway dashboard for the deployment URL."
fi

echo ""
echo "📋 Next Steps:"
echo "1. Add persistent volume in Railway dashboard:"
echo "   - Go to your project → mission-control-backend service"
echo "   - Click 'Volumes' → 'New Volume'"
echo "   - Mount path: /data/memory"
echo "   - Size: 1GB (or more as needed)"
echo ""
echo "2. Rebuild and deploy frontend:"
echo "   npm run build"
echo "   npm run deploy"
echo ""
echo "3. Sync your memory files:"
echo "   ./sync-to-railway.sh"
echo ""
