// Gateway API Service - Connects to OpenClaw Gateway for live data

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'ws://127.0.0.1:18789';
const GATEWAY_HTTP_URL = GATEWAY_URL.replace('ws://', 'http://').replace('wss://', 'https://');

export interface LiveSession {
  key: string;
  kind: string;
  displayName: string;
  updatedAt: number;
  model: string;
  contextTokens?: number;
  totalTokens?: number;
  label?: string;
}

export interface GatewayStatus {
  status: string;
  uptime: number;
  version: string;
}

class GatewayService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = GATEWAY_HTTP_URL;
  }

  // Get all live sessions (subagents)
  async getSessions(): Promise<LiveSession[]> {
    try {
      // Try Gateway HTTP API first
      const response = await fetch(`${this.baseUrl}/api/sessions`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.sessions || [];
      }
    } catch (error) {
      console.log('Gateway HTTP unavailable, using localStorage fallback');
    }

    // Fallback: return cached sessions from localStorage
    const cached = localStorage.getItem('mc-sessions');
    return cached ? JSON.parse(cached) : [];
  }

  // Get session history/transcript
  async getSessionHistory(sessionKey: string, limit: number = 50): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/sessions/${encodeURIComponent(sessionKey)}/history?limit=${limit}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.messages || [];
      }
    } catch (error) {
      console.log('Session history unavailable');
    }
    return [];
  }

  // Get Gateway status
  async getStatus(): Promise<GatewayStatus | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log('Gateway status check failed');
    }
    return null;
  }

  // Cache sessions to localStorage for offline/fallback
  cacheSessions(sessions: LiveSession[]) {
    localStorage.setItem('mc-sessions', JSON.stringify(sessions));
    localStorage.setItem('mc-sessions-last-update', Date.now().toString());
  }

  // Get last update time
  getLastUpdateTime(): number {
    const last = localStorage.getItem('mc-sessions-last-update');
    return last ? parseInt(last) : 0;
  }
}

export const gatewayService = new GatewayService();
