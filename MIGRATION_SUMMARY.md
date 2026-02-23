# Mission Control Railway Migration Summary

## ✅ Completed

### 1. Platform Research & Selection
**Chosen: Railway.app** over Fly.io
- Better developer experience
- Easier persistent volume management
- 5GB volume included in Hobby plan ($5/mo)
- Native WebSocket support
- $5 free trial credits

### 2. Server Code Updates (`server.cjs`)
- ✅ Added disk persistence layer
- ✅ Loads files from `/data/memory` on startup
- ✅ Saves files to disk on every write
- ✅ Graceful fallback if volume unavailable
- ✅ Health check includes storage status

### 3. Railway Configuration
- ✅ `railway.toml` with volume mount config
- ✅ `nixpacks.toml` for build configuration
- ✅ `Dockerfile` as fallback

### 4. Deployment Scripts
- ✅ `deploy-railway.sh` - One-command deployment
- ✅ `sync-to-railway.sh` - Memory file uploader
- ✅ `RAILWAY_DEPLOYMENT.md` - Complete guide

### 5. Git Commit
- ✅ All changes committed to main branch

---

## 📋 Remaining Steps (Manual)

### Step 1: Login to Railway
```bash
cd /Users/assistattrae/.openclaw/workspace/mission-control
railway login
```
This opens a browser for authentication.

### Step 2: Deploy Backend
```bash
./deploy-railway.sh
```
Or manually:
```bash
railway init --name mission-control-backend
railway up
```

### Step 3: Add Persistent Volume
1. Go to https://railway.app/dashboard
2. Select your project → service
3. Click **Volumes** → **New Volume**
4. Mount path: `/data/memory`
5. Size: 1GB

### Step 4: Update Frontend
Get the Railway URL:
```bash
railway domain
```

Update `.env.production`:
```bash
VITE_GATEWAY_URL=wss://YOUR-URL.railway.app
VITE_WATCHER_URL=wss://YOUR-URL.railway.app/ws
```

### Step 5: Rebuild Frontend
```bash
npm run build
npm run deploy
```

### Step 6: Sync Memory Files
```bash
./sync-to-railway.sh
```

---

## 🔍 Verification Commands

```bash
# Test health endpoint
curl https://YOUR-URL.railway.app/health

# Check persisted files
railway run -- ls -la /data/memory

# View logs
railway logs
```

---

## 📁 Files Changed

| File | Change |
|------|--------|
| `server.cjs` | Added disk persistence |
| `railway.toml` | Volume mount config |
| `nixpacks.toml` | Build configuration |
| `RAILWAY_DEPLOYMENT.md` | Deployment guide |
| `deploy-railway.sh` | Deployment script |
| `sync-to-railway.sh` | File sync script |

---

## 💰 Expected Costs

**Railway Hobby Plan: $5/month**
- Includes $5 credit
- 5GB persistent volume
- Sufficient for memory files + small app

---

## 🌐 New Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Netlify)                                     │
│  https://mission-control-tee.netlify.app               │
│         │                                               │
│         ▼                                               │
│  WebSocket Connection                                   │
│  wss://mission-control-backend.railway.app/ws          │
│         │                                               │
└─────────┼───────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────┐
│  Backend (Railway)                                      │
│  ┌─────────────────────────────────────────┐            │
│  │  Node.js Server + WebSocket             │            │
│  │  - HTTP API (/api/memory)               │            │
│  │  - WebSocket (/ws)                      │            │
│  └─────────────────────────────────────────┘            │
│         │                                               │
│         ▼                                               │
│  Persistent Volume                                      │
│  /data/memory/*.md files                               │
└─────────────────────────────────────────────────────────┘
```

---

## ⚠️ Notes

1. **Render backend** will remain running until you manually delete it from Render dashboard
2. **Memory files** currently on Render will need to be synced to new Railway volume
3. **Frontend** needs rebuild after updating `.env.production`
4. **Downtime** during migration: minimal (just DNS propagation)

---

## 🆘 Troubleshooting

### WebSocket Connection Fails
- Check URL uses `wss://` not `ws://`
- Verify Railway service is healthy
- Check browser console for CORS errors

### Files Not Persisting
- Verify volume is mounted at `/data/memory`
- Check `[FS]` logs in Railway dashboard

### Deploy Fails
- Check `railway logs` for errors
- Verify `server.cjs` syntax: `node --check server.cjs`
