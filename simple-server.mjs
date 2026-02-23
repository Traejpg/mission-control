#!/usr/bin/env node
/**
 * Simple in-memory store for Render - with markdown parsing
 */

import http from 'http';
import { WebSocketServer } from 'ws';
import { parse } from 'url';

const PORT = parseInt(process.env.PORT || '10000');

// In-memory database
const memoryStore = new Map();
const clients = new Map();

// CORS
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ==================== PARSING FUNCTIONS ====================

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

function processFile(date, data) {
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

// ==================== HTTP SERVER ====================

const server = http.createServer((req, res) => {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsed = parse(req.url, true);
  
  // Health
  if (parsed.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      files: memoryStore.size,
      timestamp: Date.now()
    }));
    return;
  }
  
  // List files
  if (parsed.pathname === '/api/memory' && req.method === 'GET') {
    const files = Array.from(memoryStore.entries())
      .map(([date, data]) => processFile(date, data))
      .sort((a, b) => b.date.localeCompare(a.date));
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ files }));
    return;
  }
  
  // Upload file
  if (parsed.pathname === '/api/memory' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { date, content } = JSON.parse(body);
        if (!date || !content) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Missing fields' }));
          return;
        }
        
        memoryStore.set(date, { content, lastModified: Date.now() });
        
        // Notify WebSocket clients
        const processed = processFile(date, { content, lastModified: Date.now() });
        broadcast({
          type: 'file_change',
          payload: { file: processed }
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, files: memoryStore.size }));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }
  
  res.writeHead(404);
  res.end('Not found');
});

// ==================== WEBSOCKET ====================

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  const id = Date.now().toString(36);
  clients.set(id, ws);
  
  console.log(`[WS] Client ${id} connected (${clients.size} total)`);
  
  // Send current files (parsed)
  const files = Array.from(memoryStore.entries())
    .map(([date, data]) => processFile(date, data));
  
  // All memories flattened
  const allMemories = files.flatMap(f => f.memories);
  
  ws.send(JSON.stringify({ type: 'files', payload: { files } }));
  ws.send(JSON.stringify({ type: 'memories', payload: { memories: allMemories } }));
  
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      
      if (msg.type === 'subscribe') {
        console.log(`[WS] ${id} subscribed to:`, msg.channels);
      }
      
      if (msg.type === 'write_file') {
        memoryStore.set(msg.date, { content: msg.content, lastModified: Date.now() });
        const processed = processFile(msg.date, { content: msg.content, lastModified: Date.now() });
        ws.send(JSON.stringify({ type: 'write_complete' }));
        broadcast({
          type: 'file_change',
          payload: { file: processed }
        });
      }
      
      if (msg.type === 'request' && msg.resource === 'memory') {
        const files = Array.from(memoryStore.entries())
          .map(([date, data]) => processFile(date, data));
        const allMemories = files.flatMap(f => f.memories);
        ws.send(JSON.stringify({ type: 'files', payload: { files } }));
        ws.send(JSON.stringify({ type: 'memories', payload: { memories: allMemories } }));
      }
      
      if (msg.type === 'request' && msg.resource === 'files') {
        const files = Array.from(memoryStore.entries())
          .map(([date, data]) => processFile(date, data));
        ws.send(JSON.stringify({ type: 'files', payload: { files } }));
      }
    } catch (err) {
      console.error('[WS] Error:', err);
    }
  });
  
  ws.on('close', () => {
    clients.delete(id);
    console.log(`[WS] Client ${id} disconnected (${clients.size} remaining)`);
  });
});

function broadcast(msg) {
  const data = JSON.stringify(msg);
  clients.forEach((ws) => {
    if (ws.readyState === 1) ws.send(data);
  });
}

server.listen(PORT, () => {
  console.log(`✅ Mission Control API on port ${PORT}`);
  console.log(`📁 Memory files: ${memoryStore.size}`);
});
