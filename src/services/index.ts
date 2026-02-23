// ==========================================
// SERVICES INDEX
// ==========================================
// Export all trading, gateway, and data services

export { 
  polygonService, 
  polymarketService, 
  kalshiService,
  tradingService 
} from './trading';

export { default as PolygonService } from './polygon';
export { default as PolymarketService } from './polymarket';
export { default as KalshiService } from './kalshi';
export { default as TradingService } from './trading';

// Gateway and File System Services (Live Command Center)
export { gatewayService, type LiveSession, type GatewayStatus } from './gateway';
export { fileSystemService, type MemoryFile } from './filesystem';

// WebSocket Service (Real-time updates)
export {
  webSocketService,
  useWebSocketConnection,
  useWebSocketSessions,
  useWebSocketMemory,
  useWebSocketLogs,
} from './websocket';

// Re-export types
export type { 
  UnifiedMarketData, 
  PriceAlert, 
  SignalConfig 
} from './trading';

export type { PolygonQuote, PolygonTicker } from './polygon';
export type { PolymarketEvent, PolymarketMarket, PolymarketPrice } from './polymarket';
export type { 
  KalshiEvent, 
  KalshiMarket, 
  KalshiPortfolio, 
  KalshiPosition,
  KalshiOrderBook 
} from './kalshi';
