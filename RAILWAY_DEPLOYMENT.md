# 🚂 Railway Deployment Guide

## Platform Choice: Railway vs Fly.io

After research, **Railway** was selected for the following reasons:

| Factor | Railway | Fly.io | Winner |
|--------|---------|--------|--------|
| **Ease of Setup** | Git push or CLI, very simple | CLI-based, more config | Railway |
| **Persistent Storage** | 5GB included in Hobby ($5/mo) | $0.15/GB, more complex setup | Railway |
| **WebSocket Support** | Native, no config needed | Native | Tie |
| **Free Trial** | $5 credits, 30 days | Requires credit card | Railway |
| **Pricing** | $5/mo Hobby plan | $5/mo credit | Tie |
| **Volume Management** | UI + Config, intuitive | CLI commands | Railway |
| **Developer Experience** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Railway |

**Decision: Railway** - Better DX, easier volume management, sufficient for the use case.

---

## Deployment Steps

### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

### 2. Login to Railway

```bash
railway login
```

This will open a browser window for authentication.

### 3. Deploy Backend

```bash
cd /Users/assistattrae/.openclaw/workspace/mission-control
./deploy-railway.sh
```

Or manually:

```bash
# Initialize project (one time)
railway init --name mission-control-backend

# Deploy
railway up

# Get URL
railway domain
```

### 4. Add Persistent Volume

After first deployment:

1. Go to https://railway.app/dashboard
2. Select your `mission-control-backend` project
3. Click on the service
4. Go to **Volumes** tab
5. Click **New Volume**
6. Set:
   - **Mount Path**: `/data/memory`
   - **Size**: 1GB (or more)
7. Click **Create**

### 5. Update Frontend Config

Update `.env.production` with your Railway URL:

```bash
# Get your Railway URL
railway domain

# Update .env.production
VITE_GATEWAY_URL=wss://your-app.railway.app
VITE_WATCHER_URL=wss://your-app.railway.app/ws
```

### 6. Rebuild & Deploy Frontend

```bash
npm run build
npm run deploy
```

### 7. Sync Memory Files

```bash
./sync-to-railway.sh
```

---

## File Structure

```
mission-control/
├── server.cjs              # Updated with disk persistence
├── railway.toml            # Railway config with volume mount
├── Dockerfile              # Container config
├── deploy-railway.sh       # Deployment script
├── sync-to-railway.sh      # Memory file sync script
└── .env.production         # Frontend env vars
```

---

## Environment Variables

### Backend (Railway)

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Production mode |
| `PORT` | `${PORT}` | Railway provides this |
| `MEMORY_DIR` | `/data/memory` | Volume mount path |

### Frontend (Netlify)

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_GATEWAY_URL` | `wss://your-app.railway.app` | WebSocket URL |
| `VITE_WATCHER_URL` | `wss://your-app.railway.app/ws` | WebSocket path |

---

## Verification

### Test Backend Health

```bash
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "files": 10,
  "storage": "/data/memory",
  "persistent": true
}
```

### Test WebSocket

Open browser dev tools → Network → WS, then:
1. Open https://mission-control-tee.netlify.app
2. Check for WebSocket connection to `wss://your-app.railway.app/ws`

### Check Persisted Files

```bash
railway run -- ls -la /data/memory
```

---

## Troubleshooting

### "WebSocket connection failed"
- Ensure URL uses `wss://` not `ws://`
- Check CORS settings in server.cjs
- Verify Railway service is running

### "Files not persisting"
- Verify volume is mounted at `/data/memory`
- Check Railway dashboard → Volumes
- Look for `[FS]` logs in deployment

### "CORS errors"
- Update CORS headers in server.cjs if needed
- Add your Netlify domain to allowed origins

---

## Pricing

**Railway Hobby Plan: $5/month**
- Includes $5 monthly credit
- 5GB persistent volume included
- Perfect for this use case

**Additional costs (if exceeded):**
- Volume storage: $0.15/GB/month
- Network egress: $0.05/GB

---

## Alternative: Fly.io

If you prefer Fly.io instead:

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch app
fly launch --name mission-control-backend

# Create volume
fly volumes create memory_data --size 1

# Deploy
fly deploy

# Get URL
fly status
```

Volume config in `fly.toml`:
```toml
[mounts]
  source = "memory_data"
  destination = "/data/memory"
```
