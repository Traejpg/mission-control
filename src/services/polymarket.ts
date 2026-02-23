// ==========================================
// POLYMARKET API SERVICE
// ==========================================
// Prediction market platform
// Docs: https://docs.polymarket.com/

import type { MarketData } from '../types';

const POLYMARKET_API_URL = 'https://clob.polymarket.com';
const GAMMA_API_URL = 'https://gamma-api.polymarket.com';

export interface PolymarketEvent {
  id: string;
  ticker_slug: string;
  title: string;
  description: string;
  category: string;
  endDate: string;
  liquidity: number;
  volume: number;
  volume24hr: number;
  markets: PolymarketMarket[];
}

export interface PolymarketMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  description: string;
  outcomes: string[];
  outcomePrices: string[];
  volume: number;
  liquidity: number;
  endDate: string;
  startDate: string;
  image?: string;
  icon?: string;
  active: boolean;
  closed: boolean;
  marketMakerAddress: string;
}

export interface PolymarketPrice {
  market: string;
  asset_id: string;
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
  timestamp: string;
}

class PolymarketService {
  private apiKey: string | null;

  constructor(apiKey: string | null = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_POLYMARKET_API_KEY) || null) {
    this.apiKey = apiKey;
  }

  private async fetch<T>(url: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get active markets/events
   */
  async getActiveEvents(limit: number = 20): Promise<PolymarketEvent[]> {
    const url = `${GAMMA_API_URL}/events?active=true&closed=false&archived=false&limit=${limit}&sort=volume&order=desc`;
    return this.fetch<PolymarketEvent[]>(url);
  }

  /**
   * Get event by ID
   */
  async getEvent(eventId: string): Promise<PolymarketEvent> {
    const url = `${GAMMA_API_URL}/events/${eventId}`;
    return this.fetch<PolymarketEvent>(url);
  }

  /**
   * Get market by condition ID
   */
  async getMarket(conditionId: string): Promise<PolymarketMarket> {
    const url = `${GAMMA_API_URL}/markets/${conditionId}`;
    return this.fetch<PolymarketMarket>(url);
  }

  /**
   * Get current prices for a market
   */
  async getMarketPrices(marketId: string): Promise<PolymarketPrice> {
    const url = `${POLYMARKET_API_URL}/markets/${marketId}/book`;
    return this.fetch<PolymarketPrice>(url);
  }

  /**
   * Search markets
   */
  async searchMarkets(query: string, limit: number = 10): Promise<PolymarketEvent[]> {
    const url = `${GAMMA_API_URL}/events?search=${encodeURIComponent(query)}&active=true&limit=${limit}`;
    return this.fetch<PolymarketEvent[]>(url);
  }

  /**
   * Get markets by category
   */
  async getMarketsByCategory(category: string, limit: number = 10): Promise<PolymarketEvent[]> {
    const url = `${GAMMA_API_URL}/events?category=${encodeURIComponent(category)}&active=true&limit=${limit}`;
    return this.fetch<PolymarketEvent[]>(url);
  }

  /**
   * Convert Polymarket data to MarketData format
   */
  convertToMarketData(market: PolymarketMarket, event: PolymarketEvent): MarketData {
    // Parse outcome prices (they come as strings)
    const yesPrice = parseFloat(market.outcomePrices[0] || '0');
    const currentPrice = yesPrice * 100; // Convert to cents/probability

    // Calculate 24h change (would need historical data for accurate change)
    const change = 0;
    const changePercent = 0;

    return {
      symbol: market.slug,
      name: market.question,
      market: 'polymarket',
      price: currentPrice,
      change,
      changePercent,
      volume: market.volume,
      high24h: Math.max(yesPrice * 100, (event.volume24hr || 0)),
      low24h: Math.min(yesPrice * 100, (event.volume24hr || 0) * 0.5),
      lastUpdated: new Date(),
    };
  }

  /**
   * Get trending markets
   */
  async getTrendingMarkets(limit: number = 10): Promise<PolymarketEvent[]> {
    const url = `${GAMMA_API_URL}/events?active=true&closed=false&sort=volume24hr&order=desc&limit=${limit}`;
    return this.fetch<PolymarketEvent[]>(url);
  }

  /**
   * Get market categories
   */
  async getCategories(): Promise<string[]> {
    return [
      'Politics',
      'Crypto',
      'Sports',
      'Entertainment',
      'Science',
      'Business',
      'Technology',
      'Climate',
    ];
  }
}

export const polymarketService = new PolymarketService();
export default PolymarketService;
