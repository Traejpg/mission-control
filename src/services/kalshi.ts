// ==========================================
// KALSHI API SERVICE
// ==========================================
// Regulated prediction market
// Docs: https://trading-api.readme.io/

import type { MarketData } from '../types';

const KALSHI_API_URL = 'https://trading-api.kalshi.com/trade-api/v2';

export interface KalshiEvent {
  event_ticker: string;
  category: string;
  title: string;
  description: string;
  status: 'unopened' | 'open' | 'closed' | 'settled';
  close_time: string;
  open_time: string;
  settle_time?: string;
  markets: KalshiMarket[];
}

export interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  title: string;
  status: 'unopened' | 'open' | 'closed' | 'settled';
  yes_bid: number;
  yes_ask: number;
  last_price: number;
  volume: number;
  open_interest: number;
  liquidity: number;
  close_time: string;
  open_time: string;
  settlement_value?: number;
}

export interface KalshiPortfolio {
  balance: number;
  available_balance: number;
  portfolio_value: number;
  positions: KalshiPosition[];
}

export interface KalshiPosition {
  market_ticker: string;
  position: number;
  avg_price: number;
  side: 'yes' | 'no';
}

export interface KalshiOrderBook {
  ticker: string;
  yes_bids: Array<{ price: number; count: number }>;
  yes_asks: Array<{ price: number; count: number }>;
  no_bids: Array<{ price: number; count: number }>;
  no_asks: Array<{ price: number; count: number }>;
}

class KalshiService {
  private email: string | null;
  private password: string | null;
  private authToken: string | null = null;

  constructor(
    _apiKey: string | null = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_KALSHI_API_KEY) || null,
    email: string | null = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_KALSHI_EMAIL) || null,
    password: string | null = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_KALSHI_PASSWORD) || null
  ) {
    this.email = email;
    this.password = password;
  }

  private async getAuthToken(): Promise<string> {
    if (this.authToken) return this.authToken;
    
    if (!this.email || !this.password) {
      throw new Error('Kalshi email and password required for authentication');
    }

    const response = await fetch(`${KALSHI_API_URL}/log_in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: this.email,
        password: this.password,
      }),
    });

    if (!response.ok) {
      throw new Error(`Kalshi authentication failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.token) {
      throw new Error('Kalshi authentication failed: no token received');
    }
    this.authToken = data.token;
    // Return a non-null assertion since we just checked it
    return this.authToken!;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${KALSHI_API_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    // Add auth token if not login endpoint
    if (!endpoint.includes('log_in')) {
      const token = await this.getAuthToken();
      headers['Authorization'] = token;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Kalshi API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get all events
   */
  async getEvents(status?: 'open' | 'closed' | 'settled', limit: number = 100): Promise<{ events: KalshiEvent[] }> {
    let url = `/events?limit=${limit}`;
    if (status) url += `&status=${status}`;
    return this.fetch<{ events: KalshiEvent[] }>(url);
  }

  /**
   * Get event by ticker
   */
  async getEvent(eventTicker: string): Promise<{ event: KalshiEvent }> {
    return this.fetch<{ event: KalshiEvent }>(`/events/${eventTicker}`);
  }

  /**
   * Get market by ticker
   */
  async getMarket(marketTicker: string): Promise<{ market: KalshiMarket }> {
    return this.fetch<{ market: KalshiMarket }>(`/markets/${marketTicker}`);
  }

  /**
   * Get multiple markets
   */
  async getMarkets(eventTicker?: string, limit: number = 100): Promise<{ markets: KalshiMarket[] }> {
    let url = `/markets?limit=${limit}`;
    if (eventTicker) url += `&event_ticker=${eventTicker}`;
    return this.fetch<{ markets: KalshiMarket[] }>(url);
  }

  /**
   * Get order book for a market
   */
  async getOrderBook(marketTicker: string): Promise<KalshiOrderBook> {
    return this.fetch<KalshiOrderBook>(`/markets/${marketTicker}/orderbook`);
  }

  /**
   * Get user portfolio
   */
  async getPortfolio(): Promise<{ portfolio: KalshiPortfolio }> {
    return this.fetch<{ portfolio: KalshiPortfolio }>('/portfolio/balance');
  }

  /**
   * Get user positions
   */
  async getPositions(): Promise<{ positions: KalshiPosition[] }> {
    return this.fetch<{ positions: KalshiPosition[] }>('/portfolio/positions');
  }

  /**
   * Convert Kalshi data to MarketData format
   */
  convertToMarketData(market: KalshiMarket, event?: KalshiEvent): MarketData {
    const currentPrice = market.last_price || market.yes_bid || 0;
    const midPrice = (market.yes_bid + market.yes_ask) / 2;
    
    return {
      symbol: market.ticker,
      name: event?.title || market.title,
      market: 'kalshi',
      price: currentPrice,
      change: 0,
      changePercent: 0,
      volume: market.volume,
      high24h: Math.max(currentPrice, midPrice),
      low24h: Math.min(currentPrice, midPrice * 0.9),
      lastUpdated: new Date(),
    };
  }

  /**
   * Get markets by series ticker
   */
  async getSeries(seriesTicker: string): Promise<{ markets: KalshiMarket[] }> {
    return this.fetch<{ markets: KalshiMarket[] }>(`/series/${seriesTicker}/markets`);
  }

  /**
   * Get exchange status
   */
  async getExchangeStatus(): Promise<{ exchange_active: boolean; trading_active: boolean }> {
    return this.fetch<{ exchange_active: boolean; trading_active: boolean }>('/exchange/status');
  }

  /**
   * Get market categories
   */
  async getCategories(): Promise<{ categories: string[] }> {
    return this.fetch<{ categories: string[] }>('/events/categories');
  }

  /**
   * Search markets
   */
  async searchMarkets(query: string, limit: number = 20): Promise<{ markets: KalshiMarket[] }> {
    return this.fetch<{ markets: KalshiMarket[] }>(`/markets?search=${encodeURIComponent(query)}&limit=${limit}`);
  }
}

export const kalshiService = new KalshiService();
export default KalshiService;
