# Gateway WebSocket Setup Guide

## Overview
This adds a WebSocket endpoint to your OpenClaw Gateway for real-time updates to Mission Control.

## Installation

### 1. Install ws package
```bash
cd /path/to/openclaw/gateway
npm install ws
npm install --save-dev @types/ws
```

### 2. Copy the WebSocket server
Copy `gateway-websocket-server.ts` to your Gateway source directory.

### 3. Integrate with Gateway

Add to your Gateway's main server file (e.g., `server.ts` or `index.ts`):

```typescript
import http from 'http';
import { gatewayWebSocket } from './gateway-websocket-server';

// Your existing HTTP server setup
const server = http.createServer(app);

// Initialize WebSocket server
// Place this AFTER your HTTP routes are set up
gatewayWebSocket.initialize(server);

// Start server
server.listen(18789, () => {
  console.log('Gateway listening on port 18789');
  console.log('WebSocket endpoint: ws://127.0.0.1:18789/ws');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  gatewayWebSocket.shutdown();
  server.close();
});

process.on('SIGINT', () => {
  gatewayWebSocket.shutdown();
  server.close();
});
```

## WebSocket Protocol

### Connection
```
ws://127.0.0.1:18789/ws
```

### Client → Server Messages

#### Subscribe to channels
```json
{
  "type": "subscribe",
  "channels": ["sessions", "memory", "logs"]
}
```

#### Unsubscribe from channels
```json
{
  "type": "unsubscribe",
  "channels": ["memory"]
}
```

#### Request data
```json
{
  "type": "request",
  "resource": "sessions"
}
```

Available resources:
- `sessions` - List all active sessions
- `session_history` - Get session transcript (requires `sessionKey`)
- `memory` - List memory files
- `logs` - System logs
- `status` - Gateway health status

#### Ping (keepalive)
```json
{
  "type": "ping"
}
```

### Server → Client Messages

#### Connection confirmation
```json
{
  "type": "connected",
  "payload": {
    "clientId": "client-1234567890-abc123",
    "message": "Connected to OpenClaw Gateway"
  }
}
```

#### Sessions list
```json
{
  "type": "sessions",
  "payload": {
    "sessions": [
      {
        "key": "agent:main:subagent:abc123",
        "kind": "subagent",
        "displayName": "StackSmith",
        "label": "StackSmith: Building API",
        "updatedAt": 1234567890000,
        "model": "kimi-k2.5"
      }
    ]
  }
}
```

#### Session opened
```json
{
  "type": "session_open",
  "payload": {
    "key": "agent:main:subagent:new123",
    "displayName": "Sage",
    "label": "Sage: Research Task"
  }
}
```

#### Session closed
```json
{
  "type": "session_close",
  "payload": {
    "key": "agent:main:subagent:abc123"
  }
}
```

#### Subscription confirmation
```json
{
  "type": "subscribed",
  "payload": {
    "channels": ["sessions", "memory", "logs"]
  }
}
```

#### Error
```json
{
  "type": "error",
  "payload": {
    "message": "Unknown message type: foo"
  }
}
```

## Integration with Existing Session Management

The WebSocket server needs access to your Gateway's session data. Update the `getLiveSessions()` method in `gateway-websocket-server.ts`:

```typescript
private async getLiveSessions(): Promise<any[]> {
  // Option 1: If you have a session manager singleton
  const sessions = sessionManager.getAllSessions();
  
  // Option 2: If sessions are stored in a database
  const sessions = await db.sessions.find({ active: true });
  
  // Option 3: If sessions are in memory
  const sessions = Object.values(this.sessions);
  
  return sessions.map(s => ({
    key: s.key || s.id,
    kind: s.kind || 'session',
    displayName: s.displayName || s.name || 'Unknown',
    label: s.label,
    updatedAt: s.updatedAt || Date.now(),
    model: s.model,
    contextTokens: s.contextTokens,
    totalTokens: s.totalTokens
  }));
}
```

## Testing

### Using websocat
```bash
# Install websocat
cargo install websocat

# Connect
websocat ws://127.0.0.1:18789/ws

# Send messages
{"type":"subscribe","channels":["sessions"]}
{"type":"request","resource":"sessions"}
```

### Using browser console
```javascript
const ws = new WebSocket('ws://127.0.0.1:18789/ws');

ws.onopen = () => {
  console.log('Connected');
  ws.send(JSON.stringify({
    type: 'subscribe',
    channels: ['sessions']
  }));
};

ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};
```

## Features

- **Auto-reconnect**: Clients reconnect with exponential backoff
- **Heartbeat**: 30-second ping/pong to detect dead connections
- **Channel subscriptions**: Clients subscribe to specific data channels
- **Session monitoring**: Automatic detection of new/closed sessions
- **Broadcasting**: Efficient message routing to subscribed clients only

## Troubleshooting

### Connection refused
- Check Gateway is running on port 18789
- Verify firewall allows WebSocket connections

### No session updates
- Ensure `getLiveSessions()` integrates with your session manager
- Check browser console for WebSocket errors

### High CPU usage
- Adjust session monitor interval (default: 5 seconds)
- Reduce heartbeat frequency (default: 30 seconds)

## Security Considerations

For production deployment:

1. **Authentication**: Add token validation in `handleMessage()`
```typescript
private handleMessage(client: WebSocketClient, message: WebSocketMessage): void {
  if (message.type === 'authenticate') {
    if (!validateToken(message.token)) {
      client.ws.close(1008, 'Invalid authentication');
      return;
    }
    client.authenticated = true;
    return;
  }
  
  if (!client.authenticated) {
    this.sendToClient(client, { type: 'error', payload: { message: 'Not authenticated' } });
    return;
  }
  
  // ... rest of handling
}
```

2. **Rate limiting**: Limit message rate per client
3. **Origin validation**: Check `req.headers.origin` in connection handler
4. **WSS**: Use `wss://` in production with SSL certificates
