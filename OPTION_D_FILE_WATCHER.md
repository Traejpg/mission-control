# Option D: File Watcher Backend

## Overview
**Full two-way file sync** with real-time updates.

```
┌─────────────────────────────────────────────────────────┐
│              Mission Control (Browser)                  │
│                   (React + WebSocket)                   │
└───────────────────────┬─────────────────────────────────┘
                        │ ws://127.0.0.1:18791/ws
                        ▼
┌─────────────────────────────────────────────────────────┐
│            File Watcher Backend (Node.js)               │
│  • Watches memory/*.md files                            │
│  • Parses tasks and memories                            │
│  • Broadcasts changes via WebSocket                     │
│  • Writes files from UI edits                           │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
               ▼                      ▼
┌─────────────────────┐    ┌──────────────────────────┐
│   memory/*.md       │    │   WebSocket Clients      │
│   (Source of Truth) │    │   (Mission Control)      │
└─────────────────────┘    └──────────────────────────┘
```

## Features

| Feature | Description |
|---------|-------------|
| **File Watching** | Monitors `memory/*.md` for changes using chokidar |
| **Two-Way Sync** | Edit files → UI updates instantly; Edit UI → Files written |
| **Task Parsing** | Extracts checkboxes `- [ ]` as tasks |
| **Memory Parsing** | Extracts `## Headers` as memories |
| **Real-Time** | WebSocket broadcasts to all connected clients |
| **Conflict Prevention** | Tracks writes to prevent loops |

## Installation

### 1. Install Dependencies
```bash
cd mission-control
npm install chokidar
```

### 2. Start File Watcher Backend
```bash
node file-watcher-backend.js
```

Output:
```
╔══════════════════════════════════════════════════╗
║     File Watcher Ready                           ║
║  WebSocket: ws://127.0.0.1:18791/ws              ║
║  HTTP API:  http://127.0.0.1:18792/api/*         ║
╚══════════════════════════════════════════════════╝
```

### 3. Start Mission Control
```bash
npm run dev
# Opens http://localhost:5173
```

### 4. Configure Environment (Optional)
```bash
# Change ports
export WATCHER_PORT=18791
export MEMORY_DIR=/custom/path/to/memory

# Then run
node file-watcher-backend.js
```

## WebSocket Protocol

### Client → Server

**Subscribe to channels:**
```json
{
  "type": "subscribe",
  "channels": ["files", "tasks", "memories"]
}
```

**Request data:**
```json
{ "type": "request", "resource": "files" }
{ "type": "request", "resource": "tasks" }
{ "type": "request", "resource": "memories" }
```

**Write file (two-way sync):**
```json
{
  "type": "write_file",
  "date": "2026-02-22",
  "content": "# 2026-02-22\n\n## Notes\n\nUpdated content..."
}
```

**Create new file:**
```json
{
  "type": "create_file",
  "date": "2026-02-23",
  "template": "# 2026-02-23\n\n## Tasks\n\n- [ ] New task"
}
```

### Server → Client

**File added/changed:**
```json
{
  "type": "file_add",
  "payload": {
    "file": {
      "id": "2026-02-22",
      "date": "2026-02-22",
      "content": "...",
      "tasks": [...],
      "memories": [...]
    }
  }
}
```

**File deleted:**
```json
{
  "type": "file_delete",
  "payload": { "date": "2026-02-22" }
}
```

## File Format

The watcher parses markdown files with specific patterns:

### Tasks
```markdown
- [ ] Task title [HIGH]
- [x] Completed task [CRITICAL]
```

Priority tags: `[CRITICAL]`, `[HIGH]`, `[MEDIUM]`, `[LOW]`

### Memories
```markdown
## Memory Title
Category: project
Tags: tag1, tag2

Memory content here...
```

## HTTP API

Available at `http://127.0.0.1:18792`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Status check |
| `/api/files` | GET | List all files |
| `/api/tasks` | GET | All tasks across files |
| `/api/memories` | GET | All memories across files |

## Testing Two-Way Sync

1. **File → UI:**
   ```bash
   echo "- [ ] Test task from file" >> ~/.openclaw/workspace/memory/2026-02-22.md
   ```
   Watch Mission Control update instantly.

2. **UI → File:**
   - Open Mission Control Memory page
   - Click edit icon on a file
   - Add content, click Save
   - Check file updated: `cat memory/2026-02-22.md`

## Architecture with Unified Gateway

For complete setup with both Gateway and File Watcher:

```
Port 18789 (Unified Gateway)
├── /api/* → Gateway
├── /ws → WebSocket (sessions)
└── Proxies to File Watcher

Port 18791 (File Watcher)
├── /ws → File sync
└── Watches memory/
```

## Troubleshooting

### File changes not appearing
1. Check watcher is running: `ps aux | grep file-watcher`
2. Check memory directory exists: `ls ~/.openclaw/workspace/memory`
3. Verify WebSocket connected in Mission Control footer

### Can't edit files
1. Check file permissions: `ls -la memory/`
2. Verify not in read-only mode
3. Check for write conflicts (two clients editing same file)

### High CPU usage
- File watcher uses chokidar with efficient polling
- Adjust `awaitWriteFinish` delay if needed

## Next Steps

With Option D complete, you have:
- ✅ Real-time session monitoring (Option C)
- ✅ Real-time file sync (Option D)
- ✅ Two-way editing (files ↔ UI)
- ✅ Live task parsing
- ✅ Live memory parsing

**What's left:**
- Deploy to production (Netlify)
- Add authentication for multi-user
- Trading API integration (Polygon, etc.)
