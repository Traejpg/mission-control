#!/usr/bin/env node
/**
 * Simple in-memory store for Render - no disk dependency
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
    const files = Array.from(memoryStore.entries()).map(([date, data]) => ({
      id: date,
      date,
      name: `${date}.md`,
      size: data.content.length,
      lastModified: data.lastModified,
      content: data.content
    })).sort((a, b) => b.date.localeCompare(a.date));
    
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
        broadcast({
          type: 'memory_update',
          payload: { date, lastModified: Date.now() }
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

// WebSocket
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  const id = Date.now().toString(36);
  clients.set(id, ws);
  
  console.log(`[WS] Client ${id} connected (${clients.size} total)`);
  
  // Send current files
  const files = Array.from(memoryStore.entries()).map(([date, data]) => ({
    id: date,
    date,
    content: data.content,
    lastModified: data.lastModified
  }));
  
  ws.send(JSON.stringify({ type: 'memory', payload: { memories: files } }));
  
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      
      if (msg.type === 'subscribe') {
        console.log(`[WS] ${id} subscribed to:`, msg.channels);
      }
      
      if (msg.type === 'write_file') {
        memoryStore.set(msg.date, { content: msg.content, lastModified: Date.now() });
        ws.send(JSON.stringify({ type: 'write_complete' }));
        broadcast({
          type: 'memory_update',
          payload: { date: msg.date, lastModified: Date.now() }
        });
      }
      
      if (msg.type === 'request' && msg.resource === 'memory') {
        const files = Array.from(memoryStore.entries()).map(([date, data]) => ({
          id: date, date, content: data.content, lastModified: data.lastModified
        }));
        ws.send(JSON.stringify({ type: 'memory', payload: { memories: files } }));
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
    if (ws.readyState === 1) ws.send(data); // 1 = OPEN
  });
}

server.listen(PORT, () => {
  console.log(`✅ Mission Control API on port ${PORT}`);
  console.log(`📁 Memory files: ${memoryStore.size}`);
});
