// ==========================================
// POLYGON.IO STOCK API SERVICE
// ==========================================
// Free tier: 5 API calls/minute
// Sign up: https://polygon.io/

import type { MarketData } from '../types';

const POLYGON_API_KEY = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_POLYGON_API_KEY : '';
const BASE_URL = 'https://api.polygon.io/v2';

export interface PolygonQuote {
  ticker: string;
  queryCount: number;
  resultsCount: number;
  adjusted: boolean;
  results: Array<{
    T: string;
    v: number;
    vw: number;
    o: number;
    c: number;
    h: number;
    l: number;
    t: number;
    n: number;
  }>;
}

export interface PolygonTicker {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  type: string;
  active: boolean;
  currency_name: string;
  cik: string;
  composite_figi: string;
  share_class_figi: string;
  market_cap: number;
  phone_number: string;
  address: {
    address1: string;
    city: string;
    state: string;
    postal_code: string;
  };
  description: string;
  sic_code: string;
  sic_description: string;
  ticker_root: string;
  homepage_url: string;
  total_employees: number;
  list_date: string;
  branding: {
    logo_url: string;
    icon_url: string;
  };
  share_class_shares_outstanding: number;
  weighted_shares_outstanding: number;
  round_lot: number;
}

class PolygonService {
  private apiKey: string;
  private lastCallTime: number = 0;
  private minInterval: number = 12000; // 12 seconds between calls (5/min)

  constructor(apiKey: string = POLYGON_API_KEY || '') {
    this.apiKey = apiKey;
  }

  private async rateLimit() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    if (timeSinceLastCall < this.minInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLastCall));
    }
    this.lastCallTime = Date.now();
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Polygon API key not configured');
    }

    await this.rateLimit();

    const url = `${BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}apiKey=${this.apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Polygon API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get previous day close for a ticker
   */
  async getPreviousClose(ticker: string): Promise<PolygonQuote> {
    return this.fetch<PolygonQuote>(`/aggs/ticker/${ticker.toUpperCase()}/prev`);
  }

  /**
   * Get ticker details
   */
  async getTickerDetails(ticker: string): Promise<{ results: PolygonTicker }> {
    return this.fetch<{ results: PolygonTicker }>(`/ticker/${ticker.toUpperCase()}`);
  }

  /**
   * Get snapshot for multiple tickers
   */
  async getSnapshot(tickers: string[]): Promise<PolygonQuote[]> {
    const tickerString = tickers.join(',');
    return this.fetch<PolygonQuote[]>(`/snapshot/locale/us/markets/stocks/tickers?tickers=${tickerString}`);
  }

  /**
   * Get daily open/close for a specific date
   */
  async getDailyOpenClose(ticker: string, date: string): Promise<PolygonQuote> {
    return this.fetch<PolygonQuote>(`/aggs/ticker/${ticker.toUpperCase()}/1/day/${date}/${date}`);
  }

  /**
   * Convert Polygon data to our MarketData format
   */
  convertToMarketData(quote: PolygonQuote): MarketData {
    const result = quote.results?.[0];
    if (!result) {
      throw new Error('No results in Polygon quote');
    }

    const change = result.c - result.o;
    const changePercent = (change / result.o) * 100;

    return {
      symbol: result.T,
      name: result.T, // Will need separate call for full name
      market: 'stock',
      price: result.c,
      change,
      changePercent,
      volume: result.v,
      high24h: result.h,
      low24h: result.l,
      lastUpdated: new Date(result.t),
    };
  }

  /**
   * Search for tickers
   */
  async searchTickers(query: string): Promise<{ results: Array<{ ticker: string; name: string }> }> {
    return this.fetch<{ results: Array<{ ticker: string; name: string }> }>(
      `/tickers?search=${encodeURIComponent(query)}&active=true&sort=ticker&order=asc&limit=10`
    );
  }
}

export const polygonService = new PolygonService();
export default PolygonService;
