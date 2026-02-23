// ==========================================
// UNIFIED TRADING SERVICE
// ==========================================
// Combines Polygon, Polymarket, and Kalshi APIs
// Provides unified interface for trading bot operations

import { polygonService } from './polygon';
import { polymarketService } from './polymarket';
import { kalshiService } from './kalshi';
import type { 
  Position, 
  MarketData, 
  TradingSignal, 
  TradeDecision, 
  MarketType 
} from '../types';

// ==========================================
// TYPES
// ==========================================

export interface UnifiedMarketData extends MarketData {
  rawData?: any;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  market: MarketType;
  condition: 'above' | 'below' | 'percent_change';
  threshold: number;
  triggered: boolean;
  createdAt: Date;
}

export interface SignalConfig {
  rsiOverbought: number;
  rsiOversold: number;
  volumeSpikeThreshold: number;
  priceChangeThreshold: number;
}

// ==========================================
// SERVICE CLASS
// ==========================================

class TradingService {
  private priceAlerts: Map<string, PriceAlert> = new Map();
  private signalConfig: SignalConfig = {
    rsiOverbought: 70,
    rsiOversold: 30,
    volumeSpikeThreshold: 2.0,
    priceChangeThreshold: 0.05,
  };

  // ==========================================
  // MARKET DATA
  // ==========================================

  /**
   * Get market data for a symbol across all markets
   */
  async getMarketData(symbol: string, market: MarketType): Promise<UnifiedMarketData | null> {
    try {
      switch (market) {
        case 'stock':
          const polygonQuote = await polygonService.getPreviousClose(symbol);
          return {
            ...polygonService.convertToMarketData(polygonQuote),
            rawData: polygonQuote,
          };

        case 'polymarket':
          // For Polymarket, symbol is the market slug/condition ID
          const polyMarket = await polymarketService.getMarket(symbol);
          // Need to fetch event separately or pass it
          return {
            symbol: polyMarket.slug,
            name: polyMarket.question,
            market: 'polymarket',
            price: parseFloat(polyMarket.outcomePrices[0] || '0') * 100,
            change: 0,
            changePercent: 0,
            volume: polyMarket.volume,
            high24h: parseFloat(polyMarket.outcomePrices[0] || '0') * 100,
            low24h: parseFloat(polyMarket.outcomePrices[0] || '0') * 100,
            lastUpdated: new Date(),
            rawData: polyMarket,
          };

        case 'kalshi':
          const kalshiMarket = await kalshiService.getMarket(symbol);
          return {
            ...kalshiService.convertToMarketData(kalshiMarket.market),
            rawData: kalshiMarket,
          };

        default:
          return null;
      }
    } catch (error) {
      console.error(`Error fetching market data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get data for multiple symbols
   */
  async getBulkMarketData(
    requests: Array<{ symbol: string; market: MarketType }>
  ): Promise<UnifiedMarketData[]> {
    const results = await Promise.all(
      requests.map(req => this.getMarketData(req.symbol, req.market))
    );
    return results.filter((data): data is UnifiedMarketData => data !== null);
  }

  // ==========================================
  // SEARCH
  // ==========================================

  /**
   * Search across all markets
   */
  async searchAll(query: string): Promise<{
    stocks: Array<{ ticker: string; name: string }>;
    polymarket: any[];
    kalshi: any[];
  }> {
    const [stocks, polymarket, kalshi] = await Promise.all([
      polygonService.searchTickers(query).catch(() => ({ results: [] })),
      polymarketService.searchMarkets(query).catch(() => []),
      kalshiService.searchMarkets(query).catch(() => ({ markets: [] })),
    ]);

    return {
      stocks: stocks.results || [],
      polymarket: polymarket || [],
      kalshi: kalshi.markets || [],
    };
  }

  // ==========================================
  // ALERTS
  // ==========================================

  /**
   * Create a price alert
   */
  createAlert(
    symbol: string,
    market: MarketType,
    condition: 'above' | 'below' | 'percent_change',
    threshold: number
  ): PriceAlert {
    const alert: PriceAlert = {
      id: `alert-${Date.now()}`,
      symbol,
      market,
      condition,
      threshold,
      triggered: false,
      createdAt: new Date(),
    };
    this.priceAlerts.set(alert.id, alert);
    return alert;
  }

  /**
   * Delete an alert
   */
  deleteAlert(alertId: string): boolean {
    return this.priceAlerts.delete(alertId);
  }

  /**
   * Get all active alerts
   */
  getAlerts(): PriceAlert[] {
    return Array.from(this.priceAlerts.values());
  }

  /**
   * Check alerts against current prices
   */
  async checkAlerts(): Promise<PriceAlert[]> {
    const triggered: PriceAlert[] = [];
    
    for (const alert of this.priceAlerts.values()) {
      if (alert.triggered) continue;

      const marketData = await this.getMarketData(alert.symbol, alert.market);
      if (!marketData) continue;

      let shouldTrigger = false;

      switch (alert.condition) {
        case 'above':
          shouldTrigger = marketData.price >= alert.threshold;
          break;
        case 'below':
          shouldTrigger = marketData.price <= alert.threshold;
          break;
        case 'percent_change':
          shouldTrigger = Math.abs(marketData.changePercent) >= alert.threshold;
          break;
      }

      if (shouldTrigger) {
        alert.triggered = true;
        triggered.push(alert);
      }
    }

    return triggered;
  }

  // ==========================================
  // SIGNALS
  // ==========================================

  /**
   * Generate trading signals based on technical analysis
   */
  async generateSignals(positions: Position[]): Promise<TradingSignal[]> {
    const signals: TradingSignal[] = [];

    for (const position of positions) {
      const marketData = await this.getMarketData(position.symbol, position.market);
      if (!marketData) continue;

      // Price-based signals
      if (position.takeProfit && marketData.price >= position.takeProfit) {
        signals.push({
          id: `sig-${Date.now()}-${position.id}`,
          symbol: position.symbol,
          market: position.market,
          type: 'sell',
          strength: 'strong',
          price: marketData.price,
          reasoning: 'Take profit target reached',
          createdAt: new Date(),
          source: 'position-manager',
          executed: false,
        });
      }

      if (position.stopLoss && marketData.price <= position.stopLoss) {
        signals.push({
          id: `sig-${Date.now()}-${position.id}`,
          symbol: position.symbol,
          market: position.market,
          type: 'sell',
          strength: 'critical',
          price: marketData.price,
          reasoning: 'Stop loss triggered',
          createdAt: new Date(),
          source: 'risk-manager',
          executed: false,
        });
      }

      // Momentum signals
      if (Math.abs(marketData.changePercent) >= this.signalConfig.priceChangeThreshold * 100) {
        const type = marketData.changePercent > 0 ? 'alert' : 'alert';
        signals.push({
          id: `sig-${Date.now()}-momentum-${position.id}`,
          symbol: position.symbol,
          market: position.market,
          type,
          strength: 'moderate',
          price: marketData.price,
          reasoning: `Significant price movement: ${marketData.changePercent.toFixed(2)}%`,
          createdAt: new Date(),
          source: 'momentum-tracker',
          executed: false,
        });
      }
    }

    return signals;
  }

  /**
   * Update signal configuration
   */
  updateSignalConfig(config: Partial<SignalConfig>) {
    this.signalConfig = { ...this.signalConfig, ...config };
  }

  // ==========================================
  // PORTFOLIO & P&L
  // ==========================================

  /**
   * Calculate P&L for positions
   */
  async calculatePnL(positions: Position[]): Promise<{
    totalPnl: number;
    totalPnlPercent: number;
    realizedPnl: number;
    unrealizedPnl: number;
  }> {
    let realizedPnl = 0;
    let unrealizedPnl = 0;
    let totalCost = 0;

    const openPositions = positions.filter(p => p.status === 'open');

    // Update current prices for open positions
    for (const position of openPositions) {
      const marketData = await this.getMarketData(position.symbol, position.market);
      if (marketData) {
        position.currentPrice = marketData.price;
        position.pnl = (position.currentPrice - position.entryPrice) * position.quantity;
        position.pnlPercent = ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100;
      }
      unrealizedPnl += position.pnl;
      totalCost += position.entryPrice * position.quantity;
    }

    // Closed positions have fixed P&L
    for (const position of positions.filter(p => p.status === 'closed')) {
      realizedPnl += position.pnl;
    }

    const totalPnl = realizedPnl + unrealizedPnl;
    const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

    return {
      totalPnl,
      totalPnlPercent,
      realizedPnl,
      unrealizedPnl,
    };
  }

  // ==========================================
  // DECISION LOGGING
  // ==========================================

  /**
   * Log a trading decision
   */
  logDecision(decision: Omit<TradeDecision, 'id' | 'timestamp'>): TradeDecision {
    const fullDecision: TradeDecision = {
      id: `dec-${Date.now()}`,
      timestamp: new Date(),
      ...decision,
    };
    // In a real app, this would save to a database
    console.log('Trade Decision Logged:', fullDecision);
    return fullDecision;
  }

  // ==========================================
  // API STATUS
  // ==========================================

  /**
   * Check if APIs are configured
   */
  getApiStatus(): {
    polygon: boolean;
    polymarket: boolean;
    kalshi: boolean;
  } {
    const env = typeof import.meta !== 'undefined' ? import.meta.env : {};
    return {
      polygon: !!(env as any).VITE_POLYGON_API_KEY,
      polymarket: !!(env as any).VITE_POLYMARKET_API_KEY,
      kalshi: !!(env as any).VITE_KALSHI_API_KEY,
    };
  }
}

// ==========================================
// EXPORT
// ==========================================

export const tradingService = new TradingService();
export default TradingService;

// Re-export individual services
export { polygonService, polymarketService, kalshiService };
