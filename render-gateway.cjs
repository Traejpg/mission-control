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

// State
const clients = new Map();
let sessions = [];

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      service: 'mission-control-gateway',
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
  if (parsedUrl.pathname === '/api/memory') {
    try {
      const files = await listMemoryFiles();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ files }));
    } catch (err) {
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
      handleMessage(clientId, msg);
    } catch (err) {
      console.error('[WS] Parse error:', err);
    }
  });
  
  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`[WS] Client disconnected: ${clientId}`);
  });
});

function handleMessage(clientId, msg) {
  const client = clients.get(clientId);
  if (!client) return;
  
  switch (msg.type) {
    case 'subscribe':
      client.channels = msg.channels || [];
      console.log(`[WS] Client ${clientId} subscribed to:`, client.channels);
      break;
      
    case 'request':
      if (msg.resource === 'sessions') {
        client.ws.send(JSON.stringify({
          type: 'sessions',
          payload: { sessions },
          timestamp: Date.now()
        }));
      }
      break;
  }
}

// ==================== MEMORY FILES ====================

async function listMemoryFiles() {
  try {
    const entries = await fs.readdir(MEMORY_DIR, { withFileTypes: true });
    const files = [];
    
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const stat = await fs.stat(path.join(MEMORY_DIR, entry.name));
        files.push({
          name: entry.name,
          size: stat.size,
          modified: stat.mtime.toISOString()
        });
      }
    }
    
    return files.sort((a, b) => new Date(b.modified) - new Date(a.modified));
  } catch (err) {
    console.error('[Memory] Error listing files:', err);
    return [];
  }
}

// ==================== START ====================

server.listen(PORT, () => {
  console.log(`✅ Mission Control Gateway running on port ${PORT}`);
  console.log(`📁 Memory directory: ${MEMORY_DIR}`);
  console.log(`🌐 CORS origin: ${CORS_HEADERS['Access-Control-Allow-Origin']}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});
