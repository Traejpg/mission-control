# 🚀 Cloud Deployment Guide

Deploy Mission Control backends to Railway.app (recommended) for 24/7 access from anywhere.

## 📋 Overview

| Service | Local Port | Cloud URL | Purpose |
|---------|-----------|-----------|---------|
| Unified Gateway | 18789 | `wss://your-app.railway.app` | Session monitoring |
| File Watcher | 18791 | `wss://your-app.railway.app/ws` | File sync |
| Mission Control | 5173 | `https://mission-control-tee.netlify.app` | Frontend |

## 🚂 Option 1: Railway.app (Recommended - Free Tier)

### Step 1: Sign Up
1. Go to https://railway.app
2. Sign up with GitHub
3. Verify email

### Step 2: Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

### Step 3: Deploy from This Directory
```bash
cd /Users/assistattrae/.openclaw/workspace/mission-control

# Create new project
railway init --name mission-control-backend

# Deploy
railway up

# Get public URL
railway domain
```

### Step 4: Update Frontend
After deployment, Railway gives you a public URL like:
```
https://mission-control-backend-production.up.railway.app
```

Update `src/services/websocket.ts`:
```typescript
const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'wss://mission-control-backend-production.up.railway.app';
```

And update `src/hooks/useFileWatcher.ts`:
```typescript
const WATCHER_URL = import.meta.env.VITE_WATCHER_URL || 'wss://mission-control-backend-production.up.railway.app/ws';
```

### Step 5: Redeploy Frontend
```bash
cd /Users/assistattrae/.openclaw/workspace/mission-control
npm run build
NETLIFY_AUTH_TOKEN=nfp_FeeMoUShghNd75Ui8oaycNRza4Ta8rKp67de npx netlify deploy --prod --dir=dist --site=de2a3ebb-7df9-4d8a-abd7-93273eb4091b
```

## 🐳 Option 2: Docker + Render

### Deploy to Render.com

1. Go to https://render.com
2. Create "Web Service"
3. Connect your GitHub repo or use "Deploy from Docker"
4. Use this `Dockerfile`
5. Set environment variables

### Environment Variables
```env
NODE_ENV=production
GATEWAY_PORT=18789
WATCHER_PORT=18791
MEMORY_DIR=/app/data/memory
CORS_ORIGIN=*
```

## ☁️ Option 3: Fly.io

### Install Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

### Deploy
```bash
cd /Users/assistattrae/.openclaw/workspace/mission-control

# Create app
fly launch --name mission-control-backend

# Deploy
fly deploy

# Get URL
fly status
```

## 🔧 Environment Variables for Cloud

Create `.env.production`:
```env
# Gateway
VITE_GATEWAY_URL=wss://your-railway-url.railway.app

# File Watcher
VITE_WATCHER_URL=wss://your-railway-url.railway.app/ws

# Or separate services:
# VITE_GATEWAY_URL=wss://gateway.your-app.railway.app
# VITE_WATCHER_URL=wss://watcher.your-app.railway.app
```

## 📁 Persistent Storage (Important!)

Memory files need persistent storage in cloud:

### Railway
Add volume in `railway.toml`:
```toml
[[mounts]]
source = "memory-data"
destination = "/app/data/memory"
```

### Render
Use Render Disk:
1. Go to service settings
2. Add Disk
3. Mount path: `/app/data/memory`
4. Size: 1GB (free tier)

### Fly.io
```bash
fly volumes create memory_data --size 1
```

## ✅ Verification Steps

After cloud deployment:

1. **Test WebSocket**:
   ```bash
   curl https://your-railway-url.railway.app/health
   ```

2. **Check WebSocket**:
   Open browser dev tools → Network → WS
   Look for connection to `wss://your-url.railway.app/ws`

3. **Test from phone**:
   Open `https://mission-control-tee.netlify.app` on mobile
   Should show "LIVE" badge

## 🔄 Auto-Deploy Setup

### GitHub Integration
1. Push this repo to GitHub
2. Connect Railway/Render to GitHub
3. Enable auto-deploy on push

### Deploy Script
Save as `deploy-cloud.sh`:
```bash
#!/bin/bash
echo "🚀 Deploying to cloud..."

# Build frontend
npm run build

# Deploy to Netlify
npx netlify deploy --prod --dir=dist --site=de2a3ebb-7df9-4d8a-abd7-93273eb4091b

# Deploy backend (if using Railway CLI)
railway up

echo "✅ Deploy complete!"
```

## 💰 Cost Comparison

| Platform | Free Tier | Paid |
|----------|-----------|------|
| **Railway** | $5/month credit, 500 hours | $0.0005/GB-hour |
| **Render** | 750 hours/month, 512MB RAM | $7/month |
| **Fly.io** | $5/month credit, 3 shared-cpu-1x | ~$2/month |
| **Netlify** | 100GB bandwidth, 300 build minutes | $19/month |

**Recommendation:** Railway or Render for easiest setup.

## 🆘 Troubleshooting

### "WebSocket connection failed"
- Check CORS settings in backend
- Verify URL uses `wss://` not `ws://`
- Check firewall/security groups

### "No data showing"
- Verify persistent storage is mounted
- Check `/health` endpoint responds
- Review backend logs

### "CORS errors"
Update CORS in `unified-gateway.cjs`:
```javascript
res.setHeader('Access-Control-Allow-Origin', 'https://mission-control-tee.netlify.app');
```

## 📞 Support

- Railway: https://railway.app/help
- Render: https://render.com/docs
- Fly.io: https://fly.io/docs/

---

**Ready to deploy?** Start with Railway - it's the fastest option.
