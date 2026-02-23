// Gateway WebSocket Server - Real-time updates for Mission Control
// Add this to your OpenClaw Gateway to enable live command center

import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { getSessions, getSessionHistory } from './sessions'; // Assuming existing Gateway session management

interface WebSocketClient {
  ws: WebSocket;
  id: string;
  subscriptions: Set<string>;
  isAlive: boolean;
}

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

class GatewayWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocketClient> = new Map();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private sessionMonitorInterval: ReturnType<typeof setInterval> | null = null;
  private lastSessionState: string = '';

  // Initialize WebSocket server
  initialize(server: http.Server): void {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      perMessageDeflate: false // Disable for lower latency
    });

    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      console.log(`[WebSocket] Client connected: ${clientId} from ${req.socket.remoteAddress}`);

      const client: WebSocketClient = {
        ws,
        id: clientId,
        subscriptions: new Set(),
        isAlive: true
      };

      this.clients.set(clientId, client);

      // Send welcome message
      this.sendToClient(client, {
        type: 'connected',
        payload: { 
          clientId,
          message: 'Connected to OpenClaw Gateway',
          timestamp: Date.now()
        }
      });

      // Handle messages
      ws.on('message', (data) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(client, message);
        } catch (error) {
          console.error('[WebSocket] Invalid message format:', error);
          this.sendToClient(client, {
            type: 'error',
            payload: { message: 'Invalid message format' }
          });
        }
      });

      // Handle pong (heartbeat response)
      ws.on('pong', () => {
        client.isAlive = true;
      });

      // Handle close
      ws.on('close', () => {
        console.log(`[WebSocket] Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`[WebSocket] Client error ${clientId}:`, error);
        this.clients.delete(clientId);
      });
    });

    // Start heartbeat
    this.startHeartbeat();

    // Start session monitoring
    this.startSessionMonitor();

    console.log('[WebSocket] Server initialized on /ws');
  }

  // Handle incoming messages
  private handleMessage(client: WebSocketClient, message: WebSocketMessage): void {
    console.log(`[WebSocket] Received from ${client.id}:`, message.type);

    switch (message.type) {
      case 'subscribe':
        this.handleSubscribe(client, message);
        break;

      case 'unsubscribe':
        this.handleUnsubscribe(client, message);
        break;

      case 'request':
        this.handleRequest(client, message);
        break;

      case 'ping':
        this.sendToClient(client, { type: 'pong', payload: { timestamp: Date.now() } });
        break;

      default:
        this.sendToClient(client, {
          type: 'error',
          payload: { message: `Unknown message type: ${message.type}` }
        });
    }
  }

  // Handle subscription requests
  private handleSubscribe(client: WebSocketClient, message: WebSocketMessage): void {
    const { channels } = message;
    
    if (!Array.isArray(channels)) {
      this.sendToClient(client, {
        type: 'error',
        payload: { message: 'channels must be an array' }
      });
      return;
    }

    channels.forEach(channel => {
      client.subscriptions.add(channel);
      console.log(`[WebSocket] Client ${client.id} subscribed to: ${channel}`);
    });

    this.sendToClient(client, {
      type: 'subscribed',
      payload: { channels: Array.from(client.subscriptions) }
    });

    // Immediately send current data for subscribed channels
    channels.forEach(channel => {
      this.broadcastChannelData(channel, client);
    });
  }

  // Handle unsubscription requests
  private handleUnsubscribe(client: WebSocketClient, message: WebSocketMessage): void {
    const { channels } = message;
    
    if (Array.isArray(channels)) {
      channels.forEach(channel => {
        client.subscriptions.delete(channel);
        console.log(`[WebSocket] Client ${client.id} unsubscribed from: ${channel}`);
      });
    }

    this.sendToClient(client, {
      type: 'unsubscribed',
      payload: { channels: Array.from(client.subscriptions) }
    });
  }

  // Handle data requests
  private async handleRequest(client: WebSocketClient, message: WebSocketMessage): Promise<void> {
    const { resource } = message;

    switch (resource) {
      case 'sessions':
        await this.sendSessions(client);
        break;

      case 'session_history':
        if (message.sessionKey) {
          await this.sendSessionHistory(client, message.sessionKey, message.limit || 50);
        }
        break;

      case 'memory':
        this.sendMemoryFiles(client);
        break;

      case 'logs':
        this.sendSystemLogs(client);
        break;

      case 'status':
        this.sendStatus(client);
        break;

      default:
        this.sendToClient(client, {
          type: 'error',
          payload: { message: `Unknown resource: ${resource}` }
        });
    }
  }

  // Send sessions data to client
  private async sendSessions(client?: WebSocketClient): Promise<void> {
    try {
      // Get live sessions from Gateway
      const sessions = await this.getLiveSessions();
      
      const message = {
        type: 'sessions',
        payload: { sessions },
        timestamp: Date.now()
      };

      if (client) {
        this.sendToClient(client, message);
      } else {
        this.broadcastToChannel('sessions', message);
      }
    } catch (error) {
      console.error('[WebSocket] Error getting sessions:', error);
    }
  }

  // Send session history
  private async sendSessionHistory(client: WebSocketClient, sessionKey: string, limit: number): Promise<void> {
    try {
      const history = await getSessionHistory(sessionKey, limit);
      
      this.sendToClient(client, {
        type: 'session_history',
        payload: { sessionKey, messages: history },
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('[WebSocket] Error getting session history:', error);
      this.sendToClient(client, {
        type: 'error',
        payload: { message: 'Failed to get session history' }
      });
    }
  }

  // Send memory files (placeholder - integrate with actual file system)
  private sendMemoryFiles(client?: WebSocketClient): void {
    // This would read from the memory/ directory
    // For now, send empty array - implement based on your file structure
    const message = {
      type: 'memory',
      payload: { memories: [] },
      timestamp: Date.now()
    };

    if (client) {
      this.sendToClient(client, message);
    } else {
      this.broadcastToChannel('memory', message);
    }
  }

  // Send system logs
  private sendSystemLogs(client?: WebSocketClient): void {
    const message = {
      type: 'logs',
      payload: { logs: [] },
      timestamp: Date.now()
    };

    if (client) {
      this.sendToClient(client, message);
    } else {
      this.broadcastToChannel('logs', message);
    }
  }

  // Send Gateway status
  private sendStatus(client: WebSocketClient): void {
    this.sendToClient(client, {
      type: 'status',
      payload: {
        status: 'healthy',
        uptime: process.uptime(),
        connectedClients: this.clients.size,
        version: '1.0.0'
      },
      timestamp: Date.now()
    });
  }

  // Broadcast data to specific channel
  private broadcastToChannel(channel: string, message: any): void {
    this.clients.forEach(client => {
      if (client.subscriptions.has(channel) && client.ws.readyState === WebSocket.OPEN) {
        this.sendToClient(client, message);
      }
    });
  }

  // Broadcast to all clients
  broadcast(message: any): void {
    this.clients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        this.sendToClient(client, message);
      }
    });
  }

  // Send message to specific client
  private sendToClient(client: WebSocketClient, message: any): void {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  // Start heartbeat to detect dead connections
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client, id) => {
        if (!client.isAlive) {
          console.log(`[WebSocket] Terminating dead connection: ${id}`);
          client.ws.terminate();
          this.clients.delete(id);
          return;
        }
        
        client.isAlive = false;
        client.ws.ping();
      });
    }, 30000); // 30 second heartbeat
  }

  // Monitor sessions for changes and broadcast updates
  private startSessionMonitor(): void {
    // Check for session changes every 5 seconds
    this.sessionMonitorInterval = setInterval(async () => {
      try {
        const sessions = await this.getLiveSessions();
        const currentState = JSON.stringify(sessions);
        
        if (currentState !== this.lastSessionState) {
          this.lastSessionState = currentState;
          
          // Detect changes
          const oldSessions = JSON.parse(this.lastSessionState || '[]');
          const newSessions = sessions;
          
          // Find closed sessions
          const closedSessions = oldSessions.filter((old: any) => 
            !newSessions.find((s: any) => s.key === old.key)
          );
          
          // Find new sessions
          const openedSessions = newSessions.filter((s: any) => 
            !oldSessions.find((old: any) => old.key === s.key)
          );
          
          // Broadcast updates
          if (openedSessions.length > 0) {
            openedSessions.forEach((session: any) => {
              this.broadcastToChannel('sessions', {
                type: 'session_open',
                payload: session,
                timestamp: Date.now()
              });
            });
          }
          
          if (closedSessions.length > 0) {
            closedSessions.forEach((session: any) => {
              this.broadcastToChannel('sessions', {
                type: 'session_close',
                payload: { key: session.key },
                timestamp: Date.now()
              });
            });
          }
          
          // Always broadcast full sessions list
          this.sendSessions();
        }
      } catch (error) {
        console.error('[WebSocket] Session monitor error:', error);
      }
    }, 5000);
  }

  // Get live sessions from Gateway
  private async getLiveSessions(): Promise<any[]> {
    try {
      // Integrate with your existing session management
      // This should return the same data as your HTTP /api/sessions endpoint
      const sessions = await getSessions();
      return sessions.map((s: any) => ({
        key: s.key,
        kind: s.kind,
        displayName: s.displayName,
        label: s.label,
        updatedAt: s.updatedAt,
        model: s.model,
        contextTokens: s.contextTokens,
        totalTokens: s.totalTokens
      }));
    } catch (error) {
      console.error('[WebSocket] Error getting live sessions:', error);
      return [];
    }
  }

  // Generate unique client ID
  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Clean shutdown
  shutdown(): void {
    console.log('[WebSocket] Shutting down...');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.sessionMonitorInterval) {
      clearInterval(this.sessionMonitorInterval);
    }
    
    this.clients.forEach(client => {
      client.ws.close();
    });
    
    this.wss?.close();
    console.log('[WebSocket] Server closed');
  }
}

// Singleton instance
export const gatewayWebSocket = new GatewayWebSocketServer();

// Export for use in Gateway main file
export default GatewayWebSocketServer;
