#!/usr/bin/env node
/**
 * Standalone File Watcher for Render Cloud
 * Works without local OpenClaw dependency
 */

const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');

// Configuration
const PORT = parseInt(process.env.WATCHER_PORT || '10001');
const MEMORY_DIR = process.env.MEMORY_DIR || '/app/data/memory';

// State
const clients = new Map();
let fileCache = new Map();

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ==================== HTTP SERVER ====================

const server = http.createServer(async (req, res) => {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'file-watcher' }));
    return;
  }
  
  res.writeHead(404);
  res.end('Not found');
});

// ==================== WEBSOCKET ====================

const wss = new WebSocket.Server({ server, path: '/ws' });

wss.on('connection', (ws) => {
  const clientId = Date.now().toString(36);
  clients.set(clientId, { ws, channels: [] });
  
  console.log(`[FileWatcher] Client connected: ${clientId}`);
  
  // Send initial file list
  sendFileList(ws);
  
  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data);
      handleMessage(clientId, msg, ws);
    } catch (err) {
      console.error('[FileWatcher] Parse error:', err);
    }
  });
  
  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`[FileWatcher] Client disconnected: ${clientId}`);
  });
});

async function handleMessage(clientId, msg, ws) {
  switch (msg.type) {
    case 'subscribe':
      clients.get(clientId).channels = msg.channels || [];
      break;
      
    case 'request':
      if (msg.resource === 'files') {
        await sendFileList(ws);
      }
      break;
      
    case 'write_file':
      await writeMemoryFile(msg.date, msg.content);
      ws.send(JSON.stringify({ type: 'write_complete' }));
      break;
      
    case 'create_file':
      await createMemoryFile(msg.date, msg.template);
      break;
  }
}

async function sendFileList(ws) {
  try {
    const files = await loadMemoryFiles();
    ws.send(JSON.stringify({
      type: 'files',
      payload: { files }
    }));
  } catch (err) {
    console.error('[FileWatcher] Error loading files:', err);
  }
}

// ==================== FILE OPERATIONS ====================

async function loadMemoryFiles() {
  const files = [];
  
  try {
    await fs.mkdir(MEMORY_DIR, { recursive: true });
    const entries = await fs.readdir(MEMORY_DIR, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const filePath = path.join(MEMORY_DIR, entry.name);
        const stat = await fs.stat(filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Parse date from filename (YYYY-MM-DD.md)
        const date = entry.name.replace('.md', '');
        
        files.push({
          id: date,
          date: date,
          name: entry.name,
          content,
          lastModified: stat.mtime.getTime(),
          size: stat.size
        });
      }
    }
  } catch (err) {
    console.error('[FileWatcher] Error reading memory dir:', err);
  }
  
  return files.sort((a, b) => b.date.localeCompare(a.date));
}

async function writeMemoryFile(date, content) {
  const filePath = path.join(MEMORY_DIR, `${date}.md`);
  try {
    await fs.mkdir(MEMORY_DIR, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`[FileWatcher] Wrote: ${filePath}`);
    
    // Notify all clients
    broadcast({
      type: 'file_change',
      payload: { date, content }
    });
  } catch (err) {
    console.error('[FileWatcher] Write error:', err);
  }
}

async function createMemoryFile(date, template) {
  const filePath = path.join(MEMORY_DIR, `${date}.md`);
  
  try {
    await fs.mkdir(MEMORY_DIR, { recursive: true });
    
    // Check if exists
    try {
      await fs.access(filePath);
      console.log(`[FileWatcher] File exists: ${filePath}`);
      return;
    } catch {
      // File doesn't exist, create it
    }
    
    const content = template || `# ${date}\n\n## Notes\n\n## Tasks\n\n## Memories\n`;
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`[FileWatcher] Created: ${filePath}`);
    
    broadcast({
      type: 'file_add',
      payload: { date, content }
    });
  } catch (err) {
    console.error('[FileWatcher] Create error:', err);
  }
}

function broadcast(msg) {
  const data = JSON.stringify(msg);
  clients.forEach(({ ws }) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
}

// ==================== START ====================

server.listen(PORT, () => {
  console.log(`✅ File Watcher running on port ${PORT}`);
  console.log(`📁 Memory directory: ${MEMORY_DIR}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});
