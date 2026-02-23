// Ultra-simple Render server - no parsing, just storage
const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 10000;
const memoryStore = new Map();

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Simple task parser (robust)
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

// Simple memory parser (robust)
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
        date: new Date(source).toISOString(),
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
    date,
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
    res.end(JSON.stringify({status: 'ok', files: memoryStore.size}));
    return;
  }

  // GET files
  if (url === '/api/memory' && req.method === 'GET') {
    try {
      const files = [];
      for (const [date, data] of memoryStore) {
        files.push(makeFile(date, data));
      }
      files.sort((a,b) => b.date.localeCompare(a.date));
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
        memoryStore.set(date, {content, lastModified: Date.now()});
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({success: true, files: memoryStore.size}));
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

wss.on('connection', (ws) => {
  console.log('[WS] Client connected');
  
  // Send current state
  try {
    const files = [];
    for (const [date, data] of memoryStore) {
      files.push(makeFile(date, data));
    }
    const allMemories = files.flatMap(f => f.memories);
    
    ws.send(JSON.stringify({type: 'files', payload: {files}}));
    ws.send(JSON.stringify({type: 'memories', payload: {memories: allMemories}}));
  } catch (e) {
    console.error('[WS] Send error:', e.message);
  }

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);
      
      if (msg.type === 'write_file' && msg.date && msg.content) {
        memoryStore.set(msg.date, {content: msg.content, lastModified: Date.now()});
        ws.send(JSON.stringify({type: 'write_complete'}));
        
        // Broadcast update
        const file = makeFile(msg.date, {content: msg.content, lastModified: Date.now()});
        const broadcast = JSON.stringify({type: 'file_change', payload: {file}});
        wss.clients.forEach(c => {
          if (c.readyState === WebSocket.OPEN) c.send(broadcast);
        });
      }
      
      if (msg.type === 'request') {
        const files = [];
        for (const [date, data] of memoryStore) {
          files.push(makeFile(date, data));
        }
        const allMemories = files.flatMap(f => f.memories);
        ws.send(JSON.stringify({type: 'files', payload: {files}}));
        ws.send(JSON.stringify({type: 'memories', payload: {memories: allMemories}}));
      }
    } catch (e) {
      console.error('[WS] Message error:', e.message);
    }
  });

  ws.on('close', () => console.log('[WS] Client disconnected'));
});

server.listen(PORT, () => {
  console.log(`✅ Server on port ${PORT}, files: ${memoryStore.size}`);
});
