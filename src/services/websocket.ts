// WebSocket Service - Real-time connection to OpenClaw Gateway

import { useState, useEffect } from 'react';
import { LiveSession } from './gateway';

type MessageHandler = (data: any) => void;
type ConnectionHandler = () => void;

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private connectionHandlers: ConnectionHandler[] = [];
  private disconnectionHandlers: ConnectionHandler[] = [];
  private url: string;
  private isIntentionallyClosed = false;

  constructor() {
    // Convert HTTP URL to WebSocket URL
    const gatewayUrl = import.meta.env.VITE_GATEWAY_URL || 'ws://127.0.0.1:18789';
    this.url = gatewayUrl.replace('http://', 'ws://').replace('https://', 'wss://');
  }

  // Connect to WebSocket
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    
    this.isIntentionallyClosed = false;
    
    try {
      this.ws = new WebSocket(`${this.url}/ws`);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.connectionHandlers.forEach(handler => handler());
        
        // Subscribe to channels
        this.send({ type: 'subscribe', channels: ['sessions', 'memory', 'logs'] });
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.disconnectionHandlers.forEach(handler => handler());
        
        if (!this.isIntentionallyClosed) {
          this.attemptReconnect();
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.attemptReconnect();
    }
  }

  // Disconnect WebSocket
  disconnect(): void {
    this.isIntentionallyClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Attempt reconnection with exponential backoff
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Send message to server
  send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  // Handle incoming messages
  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(message.type) || [];
    handlers.forEach(handler => handler(message.payload));
  }

  // Subscribe to message type
  on(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) handlers.splice(index, 1);
      }
    };
  }

  // Connection event handlers
  onConnect(handler: ConnectionHandler): () => void {
    this.connectionHandlers.push(handler);
    return () => {
      const index = this.connectionHandlers.indexOf(handler);
      if (index > -1) this.connectionHandlers.splice(index, 1);
    };
  }

  onDisconnect(handler: ConnectionHandler): () => void {
    this.disconnectionHandlers.push(handler);
    return () => {
      const index = this.disconnectionHandlers.indexOf(handler);
      if (index > -1) this.disconnectionHandlers.splice(index, 1);
    };
  }

  // Get connection status
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Request data refresh
  refreshSessions(): void {
    this.send({ type: 'request', resource: 'sessions' });
  }

  refreshMemory(): void {
    this.send({ type: 'request', resource: 'memory' });
  }

  refreshLogs(): void {
    this.send({ type: 'request', resource: 'logs' });
  }
}

export const webSocketService = new WebSocketService();

// Hook for WebSocket connection status
export function useWebSocketConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    const unsubscribeConnect = webSocketService.onConnect(() => {
      setIsConnected(true);
    });

    const unsubscribeDisconnect = webSocketService.onDisconnect(() => {
      setIsConnected(false);
    });

    // Start connection
    webSocketService.connect();

    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
    };
  }, []);

  return { isConnected, lastMessage };
}

// Hook for live sessions via WebSocket
export function useWebSocketSessions(): LiveSession[] {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connection handlers
    const unsubConnect = webSocketService.onConnect(() => {
      setIsConnected(true);
      webSocketService.refreshSessions();
    });

    const unsubDisconnect = webSocketService.onDisconnect(() => {
      setIsConnected(false);
    });

    // Message handlers
    const unsubSessions = webSocketService.on('sessions', (data) => {
      setSessions(data.sessions || []);
    });

    const unsubSessionUpdate = webSocketService.on('session_update', (data) => {
      setSessions(prev => {
        const index = prev.findIndex(s => s.key === data.key);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...data };
          return updated;
        }
        return [...prev, data];
      });
    });

    const unsubSessionClose = webSocketService.on('session_close', (data) => {
      setSessions(prev => prev.filter(s => s.key !== data.key));
    });

    // Initial connection
    webSocketService.connect();

    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubSessions();
      unsubSessionUpdate();
      unsubSessionClose();
    };
  }, []);

  return sessions;
}

// Hook for live memory updates via WebSocket
export function useWebSocketMemory(): { memories: any[]; isConnected: boolean } {
  const [memories, setMemories] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const unsubConnect = webSocketService.onConnect(() => {
      setIsConnected(true);
      webSocketService.refreshMemory();
    });

    const unsubDisconnect = webSocketService.onDisconnect(() => {
      setIsConnected(false);
    });

    const unsubMemory = webSocketService.on('memory', (data) => {
      setMemories(data.memories || []);
    });

    const unsubMemoryUpdate = webSocketService.on('memory_update', (data) => {
      setMemories(prev => {
        const index = prev.findIndex(m => m.id === data.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = data;
          return updated;
        }
        return [data, ...prev];
      });
    });

    webSocketService.connect();

    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubMemory();
      unsubMemoryUpdate();
    };
  }, []);

  return { memories, isConnected };
}

// Hook for live logs via WebSocket
export function useWebSocketLogs(): { logs: any[]; isConnected: boolean } {
  const [logs, setLogs] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const unsubConnect = webSocketService.onConnect(() => {
      setIsConnected(true);
      webSocketService.refreshLogs();
    });

    const unsubDisconnect = webSocketService.onDisconnect(() => {
      setIsConnected(false);
    });

    const unsubLogs = webSocketService.on('logs', (data) => {
      setLogs(data.logs || []);
    });

    const unsubLogEntry = webSocketService.on('log_entry', (data) => {
      setLogs(prev => [data, ...prev].slice(0, 100));
    });

    webSocketService.connect();

    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubLogs();
      unsubLogEntry();
    };
  }, []);

  return { logs, isConnected };
}
