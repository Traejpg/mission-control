#!/usr/bin/env node
/**
 * Standalone Gateway for Render Cloud
 * Mock OpenClaw Gateway for Mission Control frontend
 */

const http = require('http');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');

// Configuration
const PORT = parseInt(process.env.GATEWAY_PORT || process.env.PORT || '10000');
const MEMORY_DIR = process.env.MEMORY_DIR || '/app/data/memory';

// In-memory store for files (fallback if disk fails)
const memoryStore = new Map();

// State
const clients = new Map();
let sessions = [];

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Ensure memory directory exists
async function ensureMemoryDir() {
  try {
    await fs.mkdir(MEMORY_DIR, { recursive: true });
    console.log(`✅ Memory directory ready: ${MEMORY_DIR}`);
  } catch (err) {
    console.error(`❌ Failed to create memory dir: ${err.message}`);
  }
}

// ==================== HTTP SERVER ====================

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // Set CORS headers
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check
  if (parsedUrl.pathname === '/health') {
    const diskStatus = await checkDiskStatus();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      service: 'mission-control-gateway',
      disk: diskStatus,
      timestamp: Date.now()
    }));
    return;
  }
  
  // Sessions list
  if (parsedUrl.pathname === '/api/sessions') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ sessions }));
    return;
  }
  
  // Memory files list
  if (parsedUrl.pathname === '/api/memory' && req.method === 'GET') {
    try {
      const files = await listMemoryFiles();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ files }));
    } catch (err) {
      console.error('[API] Error listing memory:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message, files: [] }));
    }
    return;
  }
  
  // Upload memory file (POST)
  if (parsedUrl.pathname === '/api/memory' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { date, content } = JSON.parse(body);
      
      if (!date || !content) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing date or content' }));
        return;
      }
      
      await writeMemoryFile(date, content);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, date }));
      
      // Notify WebSocket clients
      broadcast({
        type: 'memory_update',
        payload: { date, content, lastModified: Date.now() }
      });
    } catch (err) {
      console.error('[API] Error uploading:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }
  
  // Default
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// ==================== WEBSOCKET ====================

const wss = new WebSocket.Server({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  const clientId = Date.now().toString(36);
  clients.set(clientId, { ws, channels: [] });
  
  console.log(`[WS] Client connected: ${clientId}`);
  
  // Send initial data
  ws.send(JSON.stringify({
    type: 'sessions',
    payload: { sessions },
    timestamp: Date.now()
  }));
  
  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data);
      handleMessage(clientId, msg, ws);
    } catch (err) {
      console.error('[WS] Parse error:', err);
    }
  });
  
  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`[WS] Client disconnected: ${clientId}`);
  });
});

async function handleMessage(clientId, msg, ws) {
  const client = clients.get(clientId);
  if (!client) return;
  
  switch (msg.type) {
    case 'subscribe':
      client.channels = msg.channels || [];
      console.log(`[WS] Client ${clientId} subscribed to:`, client.channels);
      break;
      
    case 'request':
      if (msg.resource === 'sessions') {
        ws.send(JSON.stringify({
          type: 'sessions',
          payload: { sessions },
          timestamp: Date.now()
        }));
      } else if (msg.resource === 'memory') {
        const files = await listMemoryFiles();
        ws.send(JSON.stringify({
          type: 'memory',
          payload: { memories: files },
          timestamp: Date.now()
        }));
      }
      break;
      
    case 'write_file':
      try {
        await writeMemoryFile(msg.date, msg.content);
        ws.send(JSON.stringify({ type: 'write_complete', date: msg.date }));
        broadcast({
          type: 'memory_update',
          payload: { date: msg.date, lastModified: Date.now() }
        });
      } catch (err) {
        ws.send(JSON.stringify({ type: 'error', message: err.message }));
      }
      break;
      
    case 'create_file':
      try {
        const exists = await fileExists(msg.date);
        if (!exists) {
          const template = msg.template || `# ${msg.date}\n\n## Notes\n\n## Tasks\n\n## Memories\n`;
          await writeMemoryFile(msg.date, template);
          broadcast({
            type: 'memory_update',
            payload: { date: msg.date, lastModified: Date.now() }
          });
        }
      } catch (err) {
        console.error('[WS] Create error:', err);
      }
      break;
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

// ==================== FILE OPERATIONS ====================

async function checkDiskStatus() {
  try {
    await fs.access(MEMORY_DIR);
    const files = await fs.readdir(MEMORY_DIR);
    return { status: 'ok', path: MEMORY_DIR, files: files.length };
  } catch (err) {
    return { status: 'error', path: MEMORY_DIR, error: err.message };
  }
}

async function listMemoryFiles() {
  const files = [];
  
  // First check in-memory store
  for (const [date, data] of memoryStore) {
    files.push({
      id: date,
      date: date,
      name: `${date}.md`,
      size: data.content.length,
      lastModified: data.lastModified,
      content: data.content
    });
  }
  
  // Then check disk (if available)
  try {
    await fs.mkdir(MEMORY_DIR, { recursive: true });
    const entries = await fs.readdir(MEMORY_DIR, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const date = entry.name.replace('.md', '');
        
        // Skip if already in memory store (memory store is newer)
        if (memoryStore.has(date)) continue;
        
        const filePath = path.join(MEMORY_DIR, entry.name);
        const stat = await fs.stat(filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        
        files.push({
          id: date,
          date: date,
          name: entry.name,
          size: content.length,
          lastModified: stat.mtime.getTime(),
          content
        });
        
        // Cache in memory
        memoryStore.set(date, { content, lastModified: stat.mtime.getTime() });
      }
    }
  } catch (err) {
    console.error('[Memory] Disk read error:', err.message);
  }
  
  return files.sort((a, b) => b.date.localeCompare(a.date));
}

async function writeMemoryFile(date, content) {
  // Always write to memory store
  memoryStore.set(date, { content, lastModified: Date.now() });
  
  // Try to write to disk (may fail if disk not mounted)
  try {
    await fs.mkdir(MEMORY_DIR, { recursive: true });
    const filePath = path.join(MEMORY_DIR, `${date}.md`);
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`[Memory] Wrote to disk: ${filePath}`);
  } catch (err) {
    console.log(`[Memory] Stored in memory only (disk error: ${err.message})`);
  }
}

async function fileExists(date) {
  if (memoryStore.has(date)) return true;
  
  try {
    await fs.access(path.join(MEMORY_DIR, `${date}.md`));
    return true;
  } catch {
    return false;
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

// ==================== START ====================

ensureMemoryDir().then(() => {
  server.listen(PORT, () => {
    console.log(`✅ Mission Control Gateway running on port ${PORT}`);
    console.log(`📁 Memory directory: ${MEMORY_DIR}`);
    console.log(`🌐 CORS origin: ${CORS_HEADERS['Access-Control-Allow-Origin']}`);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});
