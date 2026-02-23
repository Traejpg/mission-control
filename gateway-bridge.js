#!/usr/bin/env node
/**
 * Standalone Gateway WebSocket Bridge
 * 
 * This creates a WebSocket server that bridges to the OpenClaw Gateway HTTP API.
 * Run this alongside your Gateway to enable WebSocket support immediately.
 * 
 * Usage:
 *   node gateway-bridge.js
 * 
 * Environment:
 *   GATEWAY_URL=http://127.0.0.1:18789
 *   BRIDGE_PORT=18790
 */

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://127.0.0.1:18789';
const BRIDGE_PORT = parseInt(process.env.BRIDGE_PORT || '18790');
const MEMORY_DIR = process.env.MEMORY_DIR || path.join(process.env.HOME, '.openclaw/workspace/memory');

// Track last known state for change detection
let lastSessionState = '';
let lastMemoryState = '';

// HTTP client helper
async function fetchFromGateway(endpoint) {
  try {
    const url = new URL(endpoint, GATEWAY_URL);
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`[Bridge] Error fetching ${endpoint}:`, error.message);
    return null;
  }
}

// Get sessions from Gateway
async function getSessions() {
  // Try Gateway API first
  const data = await fetchFromGateway('/api/sessions');
  if (data && data.sessions) return data.sessions;
  
  // Fallback: Check local workspace for session files
  try {
    const workspaceDir = path.dirname(MEMORY_DIR);
    const files = fs.readdirSync(workspaceDir);
    const sessionFiles = files.filter(f => f.endsWith('.jsonl'));
    
    // Parse session files to extract session info
    const sessions = [];
    for (const file of sessionFiles.slice(0, 10)) {
      try {
        const content = fs.readFileSync(path.join(workspaceDir, file), 'utf8');
        const lines = content.split('\n').filter(l => l.trim());
        if (lines.length > 0) {
          const firstLine = JSON.parse(lines[0]);
          sessions.push({
            key: file.replace('.jsonl', ''),
            kind: 'session',
            displayName: file.replace('.jsonl', '').split('-').pop() || file,
            updatedAt: firstLine.timestamp || Date.now(),
            label: null
          });
        }
      } catch (e) {}
    }
    return sessions;
  } catch (error) {
    return [];
  }
}

// Get memory files
function getMemoryFiles() {
  try {
    if (!fs.existsSync(MEMORY_DIR)) return [];
    
    const files = fs.readdirSync(MEMORY_DIR)
      .filter(f => f.endsWith('.md'))
      .sort()
      .reverse()
      .slice(0, 10);
    
    return files.map(filename => {
      const filePath = path.join(MEMORY_DIR, filename);
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      
      return {
        id: filename.replace('.md', ''),
        date: filename.replace('.md', ''),
        content: content.slice(0, 5000), // Limit size
        lastModified: stats.mtime.getTime()
      };
    });
  } catch (error) {
    console.error('[Bridge] Error reading memory:', error.message);
    return [];
  }
}

// Parse tasks from memory file
function parseTasks(content) {
  const tasks = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^- \[([ x])\]\s*(.+)/);
    if (match) {
      tasks.push({
        done: match[1] === 'x',
        title: match[2].replace(/\*\*/g, '').trim()
      });
    }
  }
  
  return tasks;
}

// WebSocket Server
const wss = new WebSocket.Server({ port: BRIDGE_PORT });
console.log(`[Bridge] WebSocket server started on ws://127.0.0.1:${BRIDGE_PORT}/ws`);
console.log(`[Bridge] Proxying to Gateway at ${GATEWAY_URL}`);
console.log(`[Bridge] Memory directory: ${MEMORY_DIR}`);

// Connected clients
const clients = new Map();

wss.on('connection', (ws, req) => {
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[Bridge] Client connected: ${clientId}`);
  
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
      message: 'Connected to Gateway Bridge',
      gatewayUrl: GATEWAY_URL,
      timestamp: Date.now()
    }
  }));
  
  // Handle messages
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`[Bridge] ${clientId}:`, message.type);
      
      switch (message.type) {
        case 'subscribe':
          message.channels?.forEach(ch => client.subscriptions.add(ch));
          ws.send(JSON.stringify({
            type: 'subscribed',
            payload: { channels: Array.from(client.subscriptions) }
          }));
          // Send initial data
          if (client.subscriptions.has('sessions')) {
            const sessions = await getSessions();
            ws.send(JSON.stringify({ type: 'sessions', payload: { sessions } }));
          }
          if (client.subscriptions.has('memory')) {
            const memories = getMemoryFiles();
            ws.send(JSON.stringify({ type: 'memory', payload: { memories } }));
          }
          break;
          
        case 'unsubscribe':
          message.channels?.forEach(ch => client.subscriptions.delete(ch));
          ws.send(JSON.stringify({
            type: 'unsubscribed',
            payload: { channels: Array.from(client.subscriptions) }
          }));
          break;
          
        case 'request':
          switch (message.resource) {
            case 'sessions': {
              const sessions = await getSessions();
              ws.send(JSON.stringify({ type: 'sessions', payload: { sessions } }));
              break;
            }
            case 'memory': {
              const memories = getMemoryFiles();
              ws.send(JSON.stringify({ type: 'memory', payload: { memories } }));
              break;
            }
            case 'status':
              ws.send(JSON.stringify({
                type: 'status',
                payload: {
                  status: 'healthy',
                  gatewayUrl: GATEWAY_URL,
                  connectedClients: clients.size,
                  timestamp: Date.now()
                }
              }));
              break;
          }
          break;
          
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', payload: { timestamp: Date.now() } }));
          break;
      }
    } catch (error) {
      console.error(`[Bridge] Error handling message from ${clientId}:`, error.message);
      ws.send(JSON.stringify({ type: 'error', payload: { message: error.message } }));
    }
  });
  
  // Heartbeat
  ws.on('pong', () => { client.isAlive = true; });
  
  // Close
  ws.on('close', () => {
    console.log(`[Bridge] Client disconnected: ${clientId}`);
    clients.delete(clientId);
  });
  
  ws.on('error', (err) => {
    console.error(`[Bridge] Client error ${clientId}:`, err.message);
    clients.delete(clientId);
  });
});

// Heartbeat interval
setInterval(() => {
  clients.forEach((client, id) => {
    if (!client.isAlive) {
      console.log(`[Bridge] Terminating dead connection: ${id}`);
      client.ws.terminate();
      clients.delete(id);
      return;
    }
    client.isAlive = false;
    client.ws.ping();
  });
}, 30000);

// Monitor sessions and broadcast changes
async function monitorSessions() {
  try {
    const sessions = await getSessions();
    const currentState = JSON.stringify(sessions.map(s => s.key).sort());
    
    if (currentState !== lastSessionState) {
      lastSessionState = currentState;
      
      // Broadcast to subscribed clients
      clients.forEach(client => {
        if (client.subscriptions.has('sessions') && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify({
            type: 'sessions',
            payload: { sessions },
            timestamp: Date.now()
          }));
        }
      });
      
      console.log(`[Bridge] Sessions updated: ${sessions.length} active`);
    }
  } catch (error) {
    console.error('[Bridge] Session monitor error:', error.message);
  }
}

// Monitor memory files
function monitorMemory() {
  try {
    const memories = getMemoryFiles();
    const currentState = JSON.stringify(memories.map(m => m.id + m.lastModified));
    
    if (currentState !== lastMemoryState) {
      lastMemoryState = currentState;
      
      clients.forEach(client => {
        if (client.subscriptions.has('memory') && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify({
            type: 'memory',
            payload: { memories },
            timestamp: Date.now()
          }));
        }
      });
      
      console.log(`[Bridge] Memory updated: ${memories.length} files`);
    }
  } catch (error) {
    console.error('[Bridge] Memory monitor error:', error.message);
  }
}

// Start monitoring
setInterval(monitorSessions, 5000);  // Check sessions every 5s
setInterval(monitorMemory, 10000);    // Check memory every 10s

console.log('[Bridge] Monitoring active');
console.log('[Bridge] Press Ctrl+C to stop');
