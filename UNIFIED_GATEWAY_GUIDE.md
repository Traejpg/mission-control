# Unified Gateway Launcher (Option A-3)

## Overview
The **Unified Gateway Launcher** combines your existing OpenClaw Gateway with a WebSocket Bridge on a **single port** — no source code modifications required.

```
┌─────────────────────────────────────────────────────────┐
│              Port 18789 (Unified)                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │           HTTP Proxy + WebSocket Router         │   │
│  └─────────────────────────────────────────────────┘   │
│                    │                                    │
│         ┌──────────┴──────────┐                        │
│         │                     │                        │
│         ▼                     ▼                        │
│  ┌─────────────┐     ┌─────────────────┐              │
│  │   Gateway   │     │  Bridge (WS)    │              │
│  │  Port 18799 │     │  Port 18790     │              │
│  │  (internal) │     │  (internal)     │              │
│  └─────────────┘     └─────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

## Installation

### 1. Install Dependencies
```bash
cd /Users/assistattrae/.openclaw/workspace/mission-control
npm install http-proxy ws
```

### 2. Update Mission Control WebSocket URL
Edit `src/services/websocket.ts`:

```typescript
// Change from:
const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'ws://127.0.0.1:18789';

// To unified port (already set as default):
const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'ws://127.0.0.1:18789';
// This stays the same — unified gateway runs on 18789!
```

Actually, no changes needed! The unified gateway runs on the same port as the regular Gateway.

### 3. Rebuild Mission Control
```bash
cd mission-control
npm run build
```

## Usage

### Start the Unified Gateway
```bash
cd /Users/assistattrae/.openclaw/workspace/mission-control
node unified-gateway.js
```

You'll see:
```
╔══════════════════════════════════════════════════╗
║     Unified Gateway Running                      ║
║                                                  ║
║  HTTP:   http://127.0.0.1:18789                  ║
║  WebSocket: ws://127.0.0.1:18789/ws              ║
║                                                  ║
║  Gateway (internal): 18799                       ║
╚══════════════════════════════════════════════════╝
```

### Start Mission Control
```bash
# In another terminal
cd mission-control
npm run dev
# Opens http://localhost:5173
```

### Verify Connection
1. Open Mission Control in browser
2. Look for green **"LIVE"** badge in header
3. Check footer shows "WebSocket Connected"
4. Dashboard shows active sessions (if any)

## How It Works

### HTTP Requests
```
Browser → Port 18789 → Proxy → Gateway (internal 18799)
```

All HTTP requests to `/api/*`, `/status`, etc. are proxied to the real Gateway.

### WebSocket Connections
```
Browser → Port 18789/ws → Bridge (WebSocket Server)
                              ↓
                         Monitors Gateway + Files
                              ↓
                         Broadcasts updates
```

WebSocket connections on `/ws` are handled by the Bridge, which:
1. Polls Gateway for session data (every 5s)
2. Watches `memory/` folder for changes (every 10s)
3. Broadcasts updates to connected Mission Control clients

## Features

| Feature | Status |
|---------|--------|
| Single port access | ✅ Port 18789 for both HTTP and WS |
| No Gateway modifications | ✅ Uses stock `openclaw gateway start` |
| Live session monitoring | ✅ Polls Gateway, broadcasts changes |
| Live memory file watching | ✅ Watches `memory/*.md` files |
| Auto-restart Gateway | ✅ If Gateway crashes, restarts in 5s |
| Health endpoint | ✅ `/health` returns status |
| Graceful shutdown | ✅ SIGTERM/SIGINT handling |

## Endpoints

### HTTP
- `http://127.0.0.1:18789/*` → Proxied to Gateway
- `http://127.0.0.1:18789/health` → Unified gateway health

### WebSocket
- `ws://127.0.0.1:18789/ws` → Bridge WebSocket

### WebSocket Messages

**Client → Server:**
```json
{ "type": "subscribe", "channels": ["sessions", "memory"] }
{ "type": "request", "resource": "sessions" }
{ "type": "ping" }
```

**Server → Client:**
```json
{ "type": "connected", "payload": { "clientId": "..." } }
{ "type": "sessions", "payload": { "sessions": [...] } }
{ "type": "session_open", "payload": { ... } }
{ "type": "session_close", "payload": { "key": "..." } }
{ "type": "memory", "payload": { "memories": [...] } }
{ "type": "pong", "payload": { "timestamp": ... } }
```

## Environment Variables

```bash
# Change unified port (default: 18789)
export GATEWAY_PORT=18800

# Change Gateway command (default: openclaw)
export GATEWAY_CMD=/path/to/custom/gateway

# Change memory directory
export MEMORY_DIR=/custom/path/to/memory

# Then run
node unified-gateway.js
```

## Troubleshooting

### Port already in use
```bash
# Kill processes on port 18789
lsof -ti:18789 | xargs kill -9

# Or use different port
export GATEWAY_PORT=18800
node unified-gateway.js
```

### Gateway won't start
```bash
# Check if openclaw is installed
which openclaw

# Check Gateway logs
cat ~/.openclaw/logs/gateway.log
```

### WebSocket not connecting
1. Check unified gateway is running: `ps aux | grep unified-gateway`
2. Verify port: `lsof -i :18789`
3. Test WebSocket manually:
   ```bash
   websocat ws://127.0.0.1:18789/ws
   ```

### No session updates
1. Check Gateway is responding: `curl http://127.0.0.1:18789/health`
2. Verify workspace directory has `.jsonl` session files
3. Check unified gateway logs for errors

## Architecture Comparison

### Before (Separate)
```
Mission Control ──► ws://127.0.0.1:18790 (Bridge)
                          │
                          ▼
                  http://127.0.0.1:18789 (Gateway)
```

### After (Unified)
```
Mission Control ──► ws://127.0.0.1:18789/ws (Unified)
                          │
                    ┌─────┴─────┐
                    ▼           ▼
              Gateway      Bridge (internal)
              (18799)      (shares 18789)
```

## Production Deployment

For production, you may want to:

1. **Use systemd** to auto-start on boot:
   ```ini
   # /etc/systemd/system/unified-gateway.service
   [Unit]
   Description=Unified OpenClaw Gateway
   After=network.target

   [Service]
   Type=simple
   User=youruser
   WorkingDirectory=/path/to/mission-control
   ExecStart=/usr/local/bin/node unified-gateway.js
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

2. **Add SSL** with nginx:
   ```nginx
   server {
       listen 443 ssl;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://127.0.0.1:18789;
       }
       
       location /ws {
           proxy_pass http://127.0.0.1:18789;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
       }
   }
   ```

## Next Steps

Once this is running, the **Option D (File Watcher Backend)** becomes:
- Just enhance the Bridge to write files back (two-way sync)
- No additional architecture changes needed

## Files Created

- `unified-gateway.js` — Main launcher
- `GATEWAY_WEBSOCKET_SETUP.md` — This guide
- `MISSION_CONTROL_SUMMARY.md` — Full project summary
