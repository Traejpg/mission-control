# Render.com Deployment Guide

## Step-by-Step Instructions

### Step 1: Push to GitHub (Recommended)

```bash
cd /Users/assistattrae/.openclaw/workspace/mission-control

# Initialize git if not already
git init
git add .
git commit -m "Mission Control - ready for Render deployment"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/mission-control.git
git push -u origin main
```

**Or** just upload the files directly in Step 2.

---

### Step 2: Create Web Service on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Choose:
   - **Deploy from GitHub repo** (if you pushed)
   - **OR** "Create web service from scratch"

---

### Step 3: Configure Service

**If using GitHub:**
- Select your `mission-control` repo
- Branch: `main`

**If uploading files:**
- Click "Upload files" and select your `mission-control` folder

**Settings:**
```
Name: mission-control-backend
Region: Oregon (US West) - closest to you
Branch: main
Runtime: Docker
Docker Command: (leave blank, uses Dockerfile)
```

---

### Step 4: Add Environment Variables

Click **"Environment"** tab, add these:

```
NODE_ENV=production
GATEWAY_PORT=10000
GATEWAY_INTERNAL_PORT=18799
WATCHER_PORT=10001
MEMORY_DIR=/app/data/memory
CORS_ORIGIN=https://mission-control-tee.netlify.app
```

**Note:** Render assigns a dynamic port via `$PORT`, so we use `10000` as internal.

---

### Step 5: Add Persistent Disk (CRITICAL!)

Memory files need to persist across deploys:

1. Click **"Disks"** tab
2. Click **"Add Disk"**
3. Settings:
   ```
   Name: memory-data
   Mount Path: /app/data/memory
   Size: 1 GB
   ```
4. Click **"Create Disk"**

---

### Step 6: Deploy!

1. Click **"Manual Deploy"** → **"Deploy latest commit"**
2. Wait for build (2-3 minutes)
3. Check logs for "✅ Deploy is live!"

---

### Step 7: Get Your URL

After deploy succeeds:

1. Click **"Settings"** tab
2. Copy the **URL**: `https://mission-control-backend.onrender.com`

---

### Step 8: Update Frontend

Update `src/services/websocket.ts`:

```typescript
const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'wss://mission-control-backend.onrender.com';
```

Update `src/hooks/useFileWatcher.ts`:

```typescript
const WATCHER_URL = import.meta.env.VITE_WATCHER_URL || 'wss://mission-control-backend.onrender.com/ws';
```

Also update `.env.production`:

```env
VITE_GATEWAY_URL=wss://mission-control-backend.onrender.com
VITE_WATCHER_URL=wss://mission-control-backend.onrender.com/ws
```

---

### Step 9: Rebuild & Redeploy Frontend

```bash
cd /Users/assistattrae/.openclaw/workspace/mission-control
npm run build

# Deploy to Netlify
NETLIFY_AUTH_TOKEN=nfp_FeeMoUShghNd75Ui8oaycNRza4Ta8rKp67de npx netlify deploy --prod --dir=dist --site=de2a3ebb-7df9-4d8a-abd7-93273eb4091b
```

---

### Step 10: Test!

1. Open `https://mission-control-tee.netlify.app` on your phone
2. Should show "LIVE" badge
3. Check Team page - should show agent status
4. Check Memory page - should sync files

---

## ⚠️ Important Notes

### Free Tier Limits
- **750 hours/month** (enough for 24/7)
- **512 MB RAM**
- **Disk sleeps after 15 min idle** (takes 30s to wake up)

### Keep It Awake (Optional)
Use UptimeRobot to ping it every 5 minutes:
1. Go to https://uptimerobot.com
2. Add monitor: `https://mission-control-backend.onrender.com/health`
3. Set interval: 5 minutes
4. Free tier works fine

### Troubleshooting

**"WebSocket connection failed"**
- Check CORS origin matches your Netlify URL
- Verify using `wss://` not `ws://`
- Check Render logs for errors

**"No data showing"**
- Verify disk is mounted at `/app/data/memory`
- Check health endpoint: `https://your-url.onrender.com/health`
- Review Render service logs

**Build fails**
- Check Dockerfile syntax
- Verify all files uploaded
- Check environment variables are set

---

## 📞 Render Support

- Docs: https://render.com/docs
- Status: https://status.render.com
- Community: https://community.render.com

---

**Ready to start?** Go to https://dashboard.render.com and create your Web Service!
