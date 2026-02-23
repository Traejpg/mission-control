#!/usr/bin/env node
/**
 * File Watcher Backend with Two-Way Sync
 * 
 * Real-time file watching with WebSocket broadcast.
 * Standalone service that can run alongside Unified Gateway.
 * 
 * Usage:
 *   node file-watcher-backend.js
 * 
 * Environment:
 *   MEMORY_DIR=./memory
 *   WATCHER_PORT=18791
 *   GATEWAY_WS_URL=ws://127.0.0.1:18789/ws
 */

const chokidar = require('chokidar');
const fs = require('fs').promises;
const path = require('path');
const WebSocket = require('ws');
const http = require('http');

// Configuration
const MEMORY_DIR = process.env.MEMORY_DIR || path.join(process.env.HOME, '.openclaw/workspace/memory');
const WATCHER_PORT = parseInt(process.env.WATCHER_PORT || '18791');
const GATEWAY_WS_URL = process.env.GATEWAY_WS_URL || 'ws://127.0.0.1:18789/ws';

// State
let fileCache = new Map();
let isWriting = new Set();
let wss = null;
let clients = new Map();

// Colors for logging
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(level, message) {
  const timestamp = new Date().toISOString();
  const color = colors[level] || colors.reset;
  console.log(`${color}[${timestamp}] [${level.toUpperCase()}]${colors.reset} ${message}`);
}

// ==================== FILE PARSING ====================

function parseTasks(content) {
  const tasks = [];
  const lines = content.split('\n');
  let taskId = 0;

  for (const line of lines) {
    const match = line.match(/^- \[([ x])\]\s*(.+)/);
    if (match) {
      const isDone = match[1] === 'x';
      const title = match[2].replace(/\*\*/g, '').trim();
      
      let priority = 'medium';
      if (title.includes('CRITICAL')) priority = 'critical';
      else if (title.includes('HIGH')) priority = 'high';
      else if (title.includes('LOW')) priority = 'low';

      tasks.push({
        id: `task-${taskId++}`,
        title: title.replace(/\[(CRITICAL|HIGH|MEDIUM|LOW)\]\s*/i, ''),
        status: isDone ? 'done' : 'todo',
        priority,
        description: '',
        assignee: 'robin',
        workflow: 'personal',
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
  }

  return tasks;
}

function parseMemories(content, source) {
  const memories = [];
  const lines = content.split('\n');
  let currentMemory = null;
  let memoryContent = [];

  for (const line of lines) {
    if (line.match(/^#{2,3}\s+/)) {
      if (currentMemory && currentMemory.title) {
        memories.push({
          ...currentMemory,
          content: memoryContent.join('\n').trim()
        });
      }

      currentMemory = {
        id: `mem-${source}-${memories.length}`,
        title: line.replace(/^#{2,3}\s+/, ''),
        category: 'general',
        date: new Date(source).toISOString(),
        tags: [],
        source
      };
      memoryContent = [];
    } else if (currentMemory) {
      if (line.toLowerCase().includes('category:')) {
        const catMatch = line.match(/category:\s*(.+)/i);
        if (catMatch) currentMemory.category = catMatch[1].trim();
      }
      
      // Parse tags
      if (line.toLowerCase().includes('tags:')) {
        const tagMatch = line.match(/tags?:\s*(.+)/i);
        if (tagMatch) {
          currentMemory.tags = tagMatch[1].split(',').map(t => t.trim().toLowerCase());
        }
      }
      
      memoryContent.push(line);
    }
  }

  if (currentMemory && currentMemory.title) {
    memories.push({
      ...currentMemory,
      content: memoryContent.join('\n').trim()
    });
  }

  return memories;
}

async function loadFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const stats = await fs.stat(filePath);
    const filename = path.basename(filePath);
    const date = filename.replace('.md', '');

    return {
      id: date,
      date,
      content,
      lastModified: stats.mtime.getTime(),
      tasks: parseTasks(content),
      memories: parseMemories(content, date)
    };
  } catch (error) {
    console.error(`[FileWatcher] Error loading ${filePath}:`, error.message);
    return null;
  }
}

// ==================== FILE WATCHER ====================

async function startFileWatcher() {
  log('blue', `Starting file watcher on ${MEMORY_DIR}`);

  // Ensure directory exists
  try {
    await fs.mkdir(MEMORY_DIR, { recursive: true });
  } catch (e) {}

  // Initial scan
  const files = await fs.readdir(MEMORY_DIR);
  const mdFiles = files.filter(f => f.endsWith('.md'));
  
  for (const filename of mdFiles) {
    const filePath = path.join(MEMORY_DIR, filename);
    const fileData = await loadFile(filePath);
    if (fileData) {
      fileCache.set(fileData.date, fileData);
    }
  }
  
  log('green', `Scanned ${mdFiles.length} files, cached ${fileCache.size}`);

  // Start watcher
  const watcher = chokidar.watch(path.join(MEMORY_DIR, '*.md'), {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100
    }
  });

  watcher
    .on('add', async (filePath) => {
      if (isWriting.has(filePath)) return;
      const filename = path.basename(filePath);
      log('green', `File added: ${filename}`);
      
      const fileData = await loadFile(filePath);
      if (fileData) {
        fileCache.set(fileData.date, fileData);
        broadcast('file_add', { file: fileData });
      }
    })
    .on('change', async (filePath) => {
      if (isWriting.has(filePath)) return;
      const filename = path.basename(filePath);
      log('cyan', `File changed: ${filename}`);
      
      const fileData = await loadFile(filePath);
      if (fileData) {
        fileCache.set(fileData.date, fileData);
        broadcast('file_change', { file: fileData });
      }
    })
    .on('unlink', (filePath) => {
      const filename = path.basename(filePath);
      const date = filename.replace('.md', '');
      log('yellow', `File deleted: ${filename}`);
      fileCache.delete(date);
      broadcast('file_delete', { date });
    });

  log('green', 'File watcher started');
  return watcher;
}

// ==================== WEBSOCKET SERVER ====================

function startWebSocketServer() {
  log('blue', `Starting WebSocket server on port ${WATCHER_PORT}`);

  wss = new WebSocket.Server({ port: WATCHER_PORT });

  wss.on('connection', (ws, req) => {
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    log('green', `Client connected: ${clientId}`);

    const client = {
      ws,
      id: clientId,
      subscriptions: new Set(),
      isAlive: true
    };
    clients.set(clientId, client);

    // Send welcome
    ws.send(JSON.stringify({
      type: 'connected',
      payload: {
        clientId,
        message: 'Connected to File Watcher Backend',
        memoryDir: MEMORY_DIR,
        fileCount: fileCache.size,
        timestamp: Date.now()
      }
    }));

    // Handle messages
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await handleMessage(client, message);
      } catch (error) {
        ws.send(JSON.stringify({ type: 'error', payload: { message: error.message } }));
      }
    });

    ws.on('pong', () => { client.isAlive = true; });
    
    ws.on('close', () => {
      log('yellow', `Client disconnected: ${clientId}`);
      clients.delete(clientId);
    });

    ws.on('error', (err) => {
      log('red', `Client error ${clientId}: ${err.message}`);
      clients.delete(clientId);
    });
  });

  // Heartbeat
  setInterval(() => {
    clients.forEach((client, id) => {
      if (!client.isAlive) {
        client.ws.terminate();
        clients.delete(id);
        return;
      }
      client.isAlive = false;
      client.ws.ping();
    });
  }, 30000);

  log('green', `WebSocket server ready on ws://127.0.0.1:${WATCHER_PORT}/ws`);
}

async function handleMessage(client, message) {
  log('cyan', `Received: ${message.type}`);

  switch (message.type) {
    case 'subscribe':
      message.channels?.forEach(ch => client.subscriptions.add(ch));
      client.ws.send(JSON.stringify({
        type: 'subscribed',
        payload: { channels: Array.from(client.subscriptions) }
      }));
      
      // Send initial data
      if (client.subscriptions.has('files') || client.subscriptions.has('memory')) {
        const files = Array.from(fileCache.values());
        client.ws.send(JSON.stringify({ type: 'files', payload: { files } }));
      }
      if (client.subscriptions.has('tasks')) {
        const tasks = Array.from(fileCache.values()).flatMap(f => f.tasks);
        client.ws.send(JSON.stringify({ type: 'tasks', payload: { tasks } }));
      }
      break;

    case 'unsubscribe':
      message.channels?.forEach(ch => client.subscriptions.delete(ch));
      client.ws.send(JSON.stringify({
        type: 'unsubscribed',
        payload: { channels: Array.from(client.subscriptions) }
      }));
      break;

    case 'request':
      await handleRequest(client, message);
      break;

    case 'write_file':
      await handleWriteFile(client, message);
      break;

    case 'create_file':
      await handleCreateFile(client, message);
      break;

    case 'ping':
      client.ws.send(JSON.stringify({ type: 'pong', payload: { timestamp: Date.now() } }));
      break;
  }
}

async function handleRequest(client, message) {
  switch (message.resource) {
    case 'files': {
      const files = Array.from(fileCache.values());
      client.ws.send(JSON.stringify({ type: 'files', payload: { files } }));
      break;
    }
    case 'tasks': {
      const tasks = Array.from(fileCache.values()).flatMap(f => f.tasks);
      client.ws.send(JSON.stringify({ type: 'tasks', payload: { tasks } }));
      break;
    }
    case 'memories': {
      const memories = Array.from(fileCache.values()).flatMap(f => f.memories);
      client.ws.send(JSON.stringify({ type: 'memories', payload: { memories } }));
      break;
    }
    case 'file': {
      if (message.date) {
        const file = fileCache.get(message.date);
        client.ws.send(JSON.stringify({ type: 'file', payload: { file } }));
      }
      break;
    }
  }
}

async function handleWriteFile(client, message) {
  const { date, content } = message;
  const filePath = path.join(MEMORY_DIR, `${date}.md`);

  try {
    isWriting.add(filePath);
    await fs.writeFile(filePath, content, 'utf8');
    
    const fileData = await loadFile(filePath);
    if (fileData) {
      fileCache.set(date, fileData);
    }

    client.ws.send(JSON.stringify({
      type: 'write_complete',
      payload: { date, success: true }
    }));
    
    log('green', `Wrote file: ${date}.md`);
  } catch (error) {
    client.ws.send(JSON.stringify({
      type: 'write_complete',
      payload: { date, success: false, error: error.message }
    }));
    log('red', `Error writing ${date}.md: ${error.message}`);
  } finally {
    setTimeout(() => isWriting.delete(filePath), 500);
  }
}

async function handleCreateFile(client, message) {
  const { date, template = '' } = message;
  const filePath = path.join(MEMORY_DIR, `${date}.md`);

  try {
    // Check if exists
    try {
      await fs.access(filePath);
      client.ws.send(JSON.stringify({
        type: 'create_complete',
        payload: { date, success: false, error: 'File already exists' }
      }));
      return;
    } catch {}

    const content = template || `# ${date}\n\n## Notes\n\n\n## Tasks\n\n- [ ] Task 1\n`;

    isWriting.add(filePath);
    await fs.writeFile(filePath, content, 'utf8');

    client.ws.send(JSON.stringify({
      type: 'create_complete',
      payload: { date, success: true }
    }));
    
    log('green', `Created file: ${date}.md`);
  } catch (error) {
    client.ws.send(JSON.stringify({
      type: 'create_complete',
      payload: { date, success: false, error: error.message }
    }));
  } finally {
    setTimeout(() => isWriting.delete(filePath), 500);
  }
}

function broadcast(type, payload) {
  const message = JSON.stringify({ type, payload, timestamp: Date.now() });
  
  clients.forEach(client => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}

// ==================== HTTP API ====================

async function startHttpApi() {
  const server = http.createServer(async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://localhost:${WATCHER_PORT}`);
    
    try {
      if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          files: fileCache.size,
          clients: clients.size,
          memoryDir: MEMORY_DIR
        }));
      }
      else if (url.pathname === '/api/files') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ files: Array.from(fileCache.values()) }));
      }
      else if (url.pathname === '/api/tasks') {
        const tasks = Array.from(fileCache.values()).flatMap(f => f.tasks);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ tasks }));
      }
      else if (url.pathname === '/api/memories') {
        const memories = Array.from(fileCache.values()).flatMap(f => f.memories);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ memories }));
      }
      else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
    }
  });

  server.listen(WATCHER_PORT + 1, () => {
    log('blue', `HTTP API on port ${WATCHER_PORT + 1}`);
  });
}

// ==================== MAIN ====================

async function main() {
  log('green', '╔══════════════════════════════════════════════════╗');
  log('green', '║     File Watcher Backend (Option D)              ║');
  log('green', '║     Two-Way File Sync with Real-Time Updates     ║');
  log('green', '╚══════════════════════════════════════════════════╝');
  
  log('blue', `Memory directory: ${MEMORY_DIR}`);
  
  // Start file watcher
  await startFileWatcher();
  
  // Start WebSocket server
  startWebSocketServer();
  
  // Start HTTP API
  await startHttpApi();
  
  log('green', '\n╔══════════════════════════════════════════════════╗');
  log('green', '║     File Watcher Ready                           ║');
  log('green', `║  WebSocket: ws://127.0.0.1:${WATCHER_PORT}/ws          ║`);
  log('green', `║  HTTP API:  http://127.0.0.1:${WATCHER_PORT + 1}/api/*    ║`);
  log('green', '╚══════════════════════════════════════════════════╝');
}

process.on('SIGTERM', () => {
  log('yellow', 'Shutting down...');
  if (wss) wss.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  log('yellow', 'Shutting down...');
  if (wss) wss.close();
  process.exit(0);
});

main().catch(error => {
  log('red', `Fatal error: ${error.message}`);
  process.exit(1);
});
