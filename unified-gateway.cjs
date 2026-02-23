#!/usr/bin/env node
/**
 * Unified Gateway Launcher
 * 
 * Combines OpenClaw Gateway (HTTP) with WebSocket Bridge on a single port.
 * No modifications to Gateway source code required.
 * 
 * Usage:
 *   node unified-gateway.js
 * 
 * Environment:
 *   GATEWAY_PORT=18789      # Port for unified access
 *   GATEWAY_CMD=openclaw    # Command to start Gateway
 *   MEMORY_DIR=...          # Path to memory folder
 * 
 * Architecture:
 *   Port 18789
 *   ├── /api/*, /ws (Gateway) → Proxied to Gateway on ephemeral port
 *   ├── /ws (Mission Control) → WebSocket Bridge
 *   └── All other routes → Gateway
 */

const http = require('http');
const httpProxy = require('http-proxy');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Configuration
const UNIFIED_PORT = parseInt(process.env.GATEWAY_PORT || '18789');
const GATEWAY_CMD = process.env.GATEWAY_CMD || 'openclaw';
const GATEWAY_INTERNAL_PORT = 18799; // Internal port for Gateway
const MEMORY_DIR = process.env.MEMORY_DIR || path.join(process.env.HOME, '.openclaw/workspace/memory');
const WORKSPACE_DIR = path.dirname(MEMORY_DIR);

// State
let gatewayProcess = null;
let bridgeWSS = null;
const clients = new Map();
let lastSessionState = '';

// Colors for logging
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(level, message) {
  const timestamp = new Date().toISOString();
  const color = colors[level] || colors.reset;
  console.log(`${color}[${timestamp}] [${level.toUpperCase()}]${colors.reset} ${message}`);
}

// ==================== GATEWAY MANAGEMENT ====================

function startGateway() {
  log('blue', `Starting OpenClaw Gateway on internal port ${GATEWAY_INTERNAL_PORT}...`);
  
  // Kill any existing Gateway on the port
  try {
    require('child_process').execSync(`lsof -ti:${UNIFIED_PORT} | xargs kill -9 2>/dev/null || true`);
    require('child_process').execSync(`lsof -ti:${GATEWAY_INTERNAL_PORT} | xargs kill -9 2>/dev/null || true`);
  } catch (e) {}
  
  // Start Gateway with internal port
  gatewayProcess = spawn('/usr/local/node-22/bin/openclaw', ['gateway', 
'start'], {
    env: {
      ...process.env,
      OPENCLAW_GATEWAY_PORT: GATEWAY_INTERNAL_PORT,
      OPENCLAW_GATEWAY_HOST: '127.0.0.1'
    },
    stdio: 'pipe'
  });
  
  gatewayProcess.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.includes('error') || line.includes('ERROR')) {
        log('red', `[Gateway] ${line}`);
      } else {
        log('blue', `[Gateway] ${line}`);
      }
    });
  });
  
  gatewayProcess.stderr.on('data', (data) => {
    log('red', `[Gateway Error] ${data.toString().trim()}`);
  });
  
  gatewayProcess.on('exit', (code) => {
    log('yellow', `Gateway exited with code ${code}`);
    if (code !== 0 && code !== null) {
      log('yellow', 'Restarting Gateway in 5 seconds...');
      setTimeout(startGateway, 5000);
    }
  });
  
  // Wait for Gateway to be ready
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const req = http.get(`http://127.0.0.1:${GATEWAY_INTERNAL_PORT}/status`, (res) => {
        if (res.statusCode === 200) {
          clearInterval(checkInterval);
          log('green', `Gateway ready on port ${GATEWAY_INTERNAL_PORT}`);
          resolve();
        }
      }).on('error', () => {
        // Still starting
      });
      req.setTimeout(1000);
    }, 1000);
    
    // Timeout after 30 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      log('yellow', 'Gateway start timeout, proceeding anyway...');
      resolve();
    }, 30000);
  });
}

function stopGateway() {
  if (gatewayProcess) {
    log('blue', 'Stopping Gateway...');
    gatewayProcess.kill('SIGTERM');
    gatewayProcess = null;
  }
}

// ==================== WEBSOCKET BRIDGE ====================

function startWebSocketBridge() {
  log('cyan', 'Starting WebSocket Bridge...');
  
  bridgeWSS = new WebSocket.Server({ noServer: true });
  
  bridgeWSS.on('connection', (ws, req) => {
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    log('green', `WebSocket client connected: ${clientId}`);
    
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
        message: 'Connected to Unified Gateway',
        gatewayPort: GATEWAY_INTERNAL_PORT,
        timestamp: Date.now()
      }
    }));
    
    // Handle messages
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await handleBridgeMessage(client, message);
      } catch (error) {
        ws.send(JSON.stringify({ type: 'error', payload: { message: error.message } }));
      }
    });
    
    // Heartbeat
    ws.on('pong', () => { client.isAlive = true; });
    
    // Close
    ws.on('close', () => {
      log('yellow', `WebSocket client disconnected: ${clientId}`);
      clients.delete(clientId);
    });
    
    ws.on('error', (err) => {
      log('red', `WebSocket client error ${clientId}: ${err.message}`);
      clients.delete(clientId);
    });
  });
  
  // Heartbeat for all clients
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
  
  // Start monitoring sessions
  startSessionMonitor();
  startMemoryMonitor();
  
  log('green', 'WebSocket Bridge ready');
}

async function handleBridgeMessage(client, message) {
  log('cyan', `Bridge received: ${message.type}`);
  
  switch (message.type) {
    case 'subscribe':
      message.channels?.forEach(ch => client.subscriptions.add(ch));
      client.ws.send(JSON.stringify({
        type: 'subscribed',
        payload: { channels: Array.from(client.subscriptions) }
      }));
      
      // Send initial data
      if (client.subscriptions.has('sessions')) {
        const sessions = await fetchSessions();
        client.ws.send(JSON.stringify({ type: 'sessions', payload: { sessions } }));
      }
      if (client.subscriptions.has('memory')) {
        const memories = getMemoryFiles();
        client.ws.send(JSON.stringify({ type: 'memory', payload: { memories } }));
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
      await handleBridgeRequest(client, message);
      break;
      
    case 'ping':
      client.ws.send(JSON.stringify({ type: 'pong', payload: { timestamp: Date.now() } }));
      break;
  }
}

async function handleBridgeRequest(client, message) {
  switch (message.resource) {
    case 'sessions': {
      const sessions = await fetchSessions();
      client.ws.send(JSON.stringify({ type: 'sessions', payload: { sessions } }));
      break;
    }
    case 'memory': {
      const memories = getMemoryFiles();
      client.ws.send(JSON.stringify({ type: 'memory', payload: { memories } }));
      break;
    }
    case 'status':
      client.ws.send(JSON.stringify({
        type: 'status',
        payload: {
          status: 'healthy',
          gatewayPort: GATEWAY_INTERNAL_PORT,
          connectedClients: clients.size,
          timestamp: Date.now()
        }
      }));
      break;
  }
}

// ==================== DATA FETCHING ====================

async function fetchSessions() {
  try {
    // Try Gateway API
    const response = await fetch(`http://127.0.0.1:${GATEWAY_INTERNAL_PORT}/api/sessions`);
    if (response.ok) {
      const data = await response.json();
      return data.sessions || [];
    }
  } catch (error) {
    // Gateway might not have this endpoint
  }
  
  // Fallback: Scan workspace for session files
  try {
    const files = fs.readdirSync(WORKSPACE_DIR);
    const sessionFiles = files.filter(f => f.endsWith('.jsonl'));
    
    return sessionFiles.slice(0, 20).map(file => {
      const stat = fs.statSync(path.join(WORKSPACE_DIR, file));
      return {
        key: file.replace('.jsonl', ''),
        kind: 'session',
        displayName: file.replace('.jsonl', '').split('-').pop() || file,
        updatedAt: stat.mtime.getTime(),
        label: null
      };
    });
  } catch (error) {
    return [];
  }
}

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
        content: content.slice(0, 10000),
        lastModified: stats.mtime.getTime()
      };
    });
  } catch (error) {
    return [];
  }
}

// ==================== MONITORS ====================

function startSessionMonitor() {
  setInterval(async () => {
    try {
      const sessions = await fetchSessions();
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
        
        log('cyan', `Sessions updated: ${sessions.length} active`);
      }
    } catch (error) {
      // Silent fail
    }
  }, 5000);
}

function startMemoryMonitor() {
  let lastMemoryState = '';
  
  setInterval(() => {
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
        
        log('cyan', `Memory updated: ${memories.length} files`);
      }
    } catch (error) {
      // Silent fail
    }
  }, 10000);
}

// ==================== UNIFIED SERVER ====================

async function startUnifiedServer() {
  log('green', `Starting Unified Gateway on port ${UNIFIED_PORT}...`);
  
  const proxy = httpProxy.createProxyServer({
    target: `http://127.0.0.1:${GATEWAY_INTERNAL_PORT}`,
    ws: true,
    changeOrigin: true
  });
  
  proxy.on('error', (err, req, res) => {
    log('red', `Proxy error: ${err.message}`);
    if (res && !res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Gateway unavailable' }));
    }
  });
  
  const server = http.createServer((req, res) => {
    // Log request
    log('blue', `${req.method} ${req.url}`);
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    // Health check endpoint
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        gateway: 'running',
        websocket: 'running',
        clients: clients.size,
        timestamp: Date.now()
      }));
      return;
    }
    
    // Proxy to Gateway
    proxy.web(req, res);
  });
  
  // Handle WebSocket upgrades
  server.on('upgrade', (request, socket, head) => {
    const pathname = request.url;
    
    // Route WebSocket based on path or query
    if (pathname === '/ws' || pathname.startsWith('/ws?')) {
      // Mission Control WebSocket
      log('green', `WebSocket upgrade: ${pathname}`);
      bridgeWSS.handleUpgrade(request, socket, head, (ws) => {
        bridgeWSS.emit('connection', ws, request);
      });
    } else {
      // Gateway WebSocket (if it has its own)
      proxy.ws(request, socket, head);
    }
  });
  
  server.listen(UNIFIED_PORT, () => {
    log('green', `╔══════════════════════════════════════════════════╗`);
    log('green', `║     Unified Gateway Running                      ║`);
    log('green', `║                                                  ║`);
    log('green', `║  HTTP:   http://127.0.0.1:${UNIFIED_PORT}              ║`);
    log('green', `║  WebSocket: ws://127.0.0.1:${UNIFIED_PORT}/ws          ║`);
    log('green', `║                                                  ║`);
    log('green', `║  Gateway (internal): ${GATEWAY_INTERNAL_PORT}                  ║`);
    log('green', `╚══════════════════════════════════════════════════╝`);
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    log('yellow', 'SIGTERM received, shutting down...');
    stopGateway();
    server.close();
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    log('yellow', 'SIGINT received, shutting down...');
    stopGateway();
    server.close();
    process.exit(0);
  });
}

// ==================== MAIN ====================

async function main() {
  log('green', '╔══════════════════════════════════════════════════╗');
  log('green', '║     Unified Gateway Launcher                     ║');
  log('green', '║     Native Gateway + WebSocket Bridge            ║');
  log('green', '╚══════════════════════════════════════════════════╝');
  
  // Start Gateway
  await startGateway();
  
  // Start WebSocket Bridge
  startWebSocketBridge();
  
  // Wait a moment for Gateway to fully initialize
  await new Promise(r => setTimeout(r, 2000));
  
  // Start Unified Server
  await startUnifiedServer();
}

main().catch(error => {
  log('red', `Fatal error: ${error.message}`);
  process.exit(1);
});
