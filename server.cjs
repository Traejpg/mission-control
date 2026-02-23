// Mission Control Backend Server - Railway Deployment
// Supports persistent storage via mounted volume

const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 10000;
const MEMORY_DIR = process.env.MEMORY_DIR || '/data/memory';
const memoryStore = new Map();

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Ensure memory directory exists
function ensureMemoryDir() {
  try {
    if (!fs.existsSync(MEMORY_DIR)) {
      fs.mkdirSync(MEMORY_DIR, { recursive: true });
      console.log(`[FS] Created memory directory: ${MEMORY_DIR}`);
    }
  } catch (e) {
    console.error(`[FS] Error creating memory directory: ${e.message}`);
  }
}

// Load files from disk
function loadFromDisk() {
  try {
    ensureMemoryDir();
    const files = fs.readdirSync(MEMORY_DIR);
    let loaded = 0;
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const date = file.replace('.md', '');
        const filePath = path.join(MEMORY_DIR, file);
        const stats = fs.statSync(filePath);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        memoryStore.set(date, {
          content,
          lastModified: stats.mtime.getTime()
        });
        loaded++;
      }
    }
    
    console.log(`[FS] Loaded ${loaded} files from ${MEMORY_DIR}`);
    return loaded;
  } catch (e) {
    console.error(`[FS] Error loading from disk: ${e.message}`);
    return 0;
  }
}

// Save file to disk
function saveToDisk(date, content) {
  try {
    ensureMemoryDir();
    const filePath = path.join(MEMORY_DIR, `${date}.md`);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`[FS] Saved ${date}.md`);
    return true;
  } catch (e) {
    console.error(`[FS] Error saving ${date}.md: ${e.message}`);
    return false;
  }
}

// Safe date formatter
function safeDate(dateStr) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return new Date().toISOString();
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// Simple task parser
function parseTasks(content) {
  const tasks = [];
  const lines = content.split('\n');
  let id = 0;
  for (const line of lines) {
    const m = line.match(/^- \[([ x])\]\s*(.+)/);
    if (m) {
      tasks.push({
        id: `task-${id++}`,
        title: m[2].replace(/\*\*/g, '').trim(),
        status: m[1] === 'x' ? 'done' : 'todo',
        priority: 'medium',
        assignee: 'robin',
        createdAt: Date.now()
      });
    }
  }
  return tasks;
}

// Simple memory parser
function parseMemories(content, source) {
  const memories = [];
  const lines = content.split('\n');
  let current = null;
  let contentLines = [];
  let idx = 0;

  for (const line of lines) {
    const header = line.match(/^##\s+(.+)/);
    if (header) {
      if (current) {
        memories.push({...current, content: contentLines.join('\n').trim()});
      }
      current = {
        id: `mem-${source}-${idx++}`,
        title: header[1],
        category: 'general',
        date: safeDate(source),
        tags: [],
        source
      };
      contentLines = [];
    } else if (current) {
      contentLines.push(line);
    }
  }
  if (current) memories.push({...current, content: contentLines.join('\n').trim()});
  return memories;
}

function makeFile(date, data) {
  return {
    id: date,
    date: date,
    name: `${date}.md`,
    content: data.content,
    lastModified: data.lastModified,
    size: data.content.length,
    tasks: parseTasks(data.content),
    memories: parseMemories(data.content, date)
  };
}

const server = http.createServer((req, res) => {
  Object.entries(CORS).forEach(([k,v]) => res.setHeader(k,v));
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = req.url;

  // Health
  if (url === '/health') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({
      status: 'ok', 
      files: memoryStore.size,
      storage: MEMORY_DIR,
      persistent: fs.existsSync(MEMORY_DIR)
    }));
    return;
  }

  // GET files
  if (url === '/api/memory' && req.method === 'GET') {
    try {
      const files = [];
      for (const [date, data] of memoryStore) {
        files.push(makeFile(date, data));
      }
      // Safe sort
      files.sort((a,b) => {
        if (!a.date || !b.date) return 0;
        return String(b.date).localeCompare(String(a.date));
      });
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({files}));
    } catch (e) {
      res.writeHead(500);
      res.end(JSON.stringify({error: e.message}));
    }
    return;
  }

  // POST file
  if (url === '/api/memory' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const {date, content} = JSON.parse(body);
        if (!date || !content) {
          res.writeHead(400);
          res.end(JSON.stringify({error: 'Missing date or content'}));
          return;
        }
        
        const data = {content, lastModified: Date.now()};
        memoryStore.set(date, data);
        
        // Persist to disk
        const saved = saveToDisk(date, content);
        
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({
          success: true, 
          files: memoryStore.size,
          persisted: saved
        }));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({error: e.message}));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

// WebSocket
const wss = new WebSocket.Server({server, path: '/ws'});

// Helper to get sorted files
function getSortedFiles() {
  const files = [];
  for (const [date, data] of memoryStore) {
    files.push(makeFile(date, data));
  }
  files.sort((a,b) => {
    if (!a.date || !b.date) return 0;
    return String(b.date).localeCompare(String(a.date));
  });
  return files;
}

wss.on('connection', (ws) => {
  console.log('[WS] Client connected');
  
  // Send current state (sorted)
  try {
    const files = getSortedFiles();
    const allMemories = files.flatMap(f => f.memories || []);
    
    ws.send(JSON.stringify({type: 'files', payload: {files}}));
    ws.send(JSON.stringify({type: 'memories', payload: {memories: allMemories}}));
  } catch (e) {
    console.error('[WS] Send error:', e.message);
  }

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);
      
      if (msg.type === 'write_file' && msg.date && msg.content) {
        const data = {content: msg.content, lastModified: Date.now()};
        memoryStore.set(msg.date, data);
        
        // Persist to disk
        const saved = saveToDisk(msg.date, msg.content);
        
        ws.send(JSON.stringify({type: 'write_complete', persisted: saved}));
        
        // Broadcast update
        const file = makeFile(msg.date, data);
        const broadcast = JSON.stringify({type: 'file_change', payload: {file}});
        wss.clients.forEach(c => {
          if (c.readyState === WebSocket.OPEN) c.send(broadcast);
        });
      }
      
      if (msg.type === 'request') {
        const files = getSortedFiles();
        const allMemories = files.flatMap(f => f.memories || []);
        ws.send(JSON.stringify({type: 'files', payload: {files}}));
        ws.send(JSON.stringify({type: 'memories', payload: {memories: allMemories}}));
      }
    } catch (e) {
      console.error('[WS] Message error:', e.message);
    }
  });

  ws.on('close', () => console.log('[WS] Client disconnected'));
});

// Load persisted data on startup
const loaded = loadFromDisk();

server.listen(PORT, () => {
  console.log(`✅ Mission Control Server running on port ${PORT}`);
  console.log(`📁 Memory storage: ${MEMORY_DIR} (${loaded} files loaded)`);
  console.log(`🔌 WebSocket path: /ws`);
});
