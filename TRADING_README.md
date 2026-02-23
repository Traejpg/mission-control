# Trading Bot Integration - Mission Control

A comprehensive trading dashboard integrated into Mission Control that supports Stocks (via Polygon.io), Polymarket prediction markets, and Kalshi event contracts.

## Features

### 📊 Portfolio Dashboard
- Real-time P&L tracking across all markets
- Win rate and trading statistics
- Profit factor and average win/loss metrics
- Daily, weekly, and monthly performance

### 📈 Position Management
- Track open and closed positions
- Support for stocks, options, binary contracts
- Stop loss and take profit monitoring
- Position tagging and notes

### 🔔 Automated Alerts
- Price threshold alerts (above/below)
- Percentage change alerts
- Volume spike detection
- Visual and notification alerts

### 🎯 Trading Signals
- AI-generated buy/sell/hold signals
- Signal strength indicators (weak/moderate/strong/critical)
- Target price and stop loss recommendations
- Signal source tracking

### 📝 Decision Logging
- Log all trading decisions with reasoning
- Track decision factors and confidence levels
- Outcome tracking for learning
- Historical decision review

### 🔌 Multi-Market Support
- **Stocks**: Via Polygon.io API
- **Options**: Tracked alongside stocks
- **Polymarket**: Prediction markets on crypto, politics, sports
- **Kalshi**: Regulated event contracts

## API Setup

### 1. Polygon.io (Stocks)

1. Sign up at [polygon.io](https://polygon.io/)
2. Get your free API key
3. Add to `.env`:
   ```
   VITE_POLYGON_API_KEY=your_polygon_api_key_here
   ```

**Free Tier Limits:**
- 5 API calls per minute
- 2 years historical data
- Previous day close data

### 2. Polymarket (Prediction Markets)

1. Create account at [polymarket.com](https://polymarket.com/)
2. Generate API key in settings
3. Add to `.env`:
   ```
   VITE_POLYMARKET_API_KEY=your_polymarket_api_key_here
   ```

**Features:**
- Browse prediction markets
- Track binary outcome probabilities
- Search by category (politics, crypto, sports, etc.)

### 3. Kalshi (Regulated Event Contracts)

1. Sign up at [kalshi.com](https://kalshi.com/)
2. Get API credentials from your account
3. Add to `.env`:
   ```
   VITE_KALSHI_API_KEY=your_kalshi_api_key_here
   VITE_KALSHI_EMAIL=your_email@example.com
   VITE_KALSHI_PASSWORD=your_password
   ```

**Note:** Kalshi requires email/password authentication for some endpoints.

## Environment Variables

Create a `.env` file in the mission-control directory:

```env
# Polygon.io - Stock Data
VITE_POLYGON_API_KEY=pk_your_polygon_key_here

# Polymarket - Prediction Markets
VITE_POLYMARKET_API_KEY=your_polymarket_key_here

# Kalshi - Event Contracts
VITE_KALSHI_API_KEY=your_kalshi_key_here
VITE_KALSHI_EMAIL=your_email@example.com
VITE_KALSHI_PASSWORD=your_password_here
```

## Usage

### Dashboard View
The dashboard shows:
- P&L summary cards
- Active positions (up to 4 visible, click "View All" for more)
- Market watch with live prices
- Active alerts
- Trading signals

### Positions Tab
Full position management:
- Filter by market type
- Filter by status (open/closed)
- Detailed position table
- Quick actions

### Signals Tab
View and manage trading signals:
- Color-coded by type and strength
- Target/stop loss levels
- One-click execute/dismiss
- Signal configuration

### History Tab
Review past activity:
- Decision log with reasoning
- Closed positions
- Performance by trade

## Adding a New Position

1. Click "New Position" button
2. Enter details:
   - Symbol (e.g., AAPL, BTC >100k Mar 31)
   - Market type (stock/option/polymarket/kalshi)
   - Entry price and quantity
   - Stop loss and take profit (optional)
3. Add tags and notes
4. Save

## Setting Alerts

1. Navigate to the Alerts panel
2. Click "Add Alert"
3. Configure:
   - Symbol to watch
   - Condition (above/below/percent_change)
   - Threshold value
4. Alerts trigger automatically when conditions are met

## API Service Usage

### Direct API Access

```typescript
import { polygonService } from './services/trading';

// Get stock quote
const quote = await polygonService.getPreviousClose('AAPL');

// Search tickers
const results = await polygonService.searchTickers('apple');
```

### Unified Trading Service

```typescript
import { tradingService } from './services/trading';

// Get data across all markets
const data = await tradingService.getMarketData('AAPL', 'stock');

// Search all markets
const results = await tradingService.searchAll('bitcoin');

// Create alert
const alert = tradingService.createAlert('NVDA', 'stock', 'above', 900);

// Check for triggered alerts
const triggered = await tradingService.checkAlerts();

// Calculate P&L
const pnl = await tradingService.calculatePnL(positions);
```

## Data Structure

### Position
```typescript
interface Position {
  id: string;
  symbol: string;
  name: string;
  market: 'stock' | 'option' | 'polymarket' | 'kalshi';
  type: 'long' | 'short' | 'call' | 'put' | 'binary';
  status: 'open' | 'closed' | 'pending';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  entryDate: Date;
  exitDate?: Date;
  stopLoss?: number;
  takeProfit?: number;
  pnl: number;
  pnlPercent: number;
  notes?: string;
  tags: string[];
}
```

### TradingSignal
```typescript
interface TradingSignal {
  id: string;
  symbol: string;
  market: MarketType;
  type: 'buy' | 'sell' | 'hold' | 'alert';
  strength: 'weak' | 'moderate' | 'strong' | 'critical';
  price: number;
  targetPrice?: number;
  stopLoss?: number;
  reasoning: string;
  source: string;
  executed: boolean;
}
```

## Risk Management

Default risk settings (configurable in `tradingConfig`):
- Max position size: $10,000
- Max daily loss: $500
- Default stop loss: 5%
- Default take profit: 10%

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari

## Troubleshooting

### API Rate Limits
- Polygon: 5 calls/minute on free tier
- Polymarket: Rate limits apply
- Kalshi: Standard REST rate limits

### Data Not Loading
1. Check API keys are set in `.env`
2. Verify API status in browser console
3. Check network tab for API errors

### Alerts Not Triggering
1. Ensure alerts are enabled in settings
2. Check that symbol exists in selected market
3. Verify condition and threshold values

## Future Enhancements

- [ ] WebSocket real-time data
- [ ] Automated trading execution
- [ ] Backtesting engine
- [ ] Options chain viewer
- [ ] Portfolio correlation analysis
- [ ] News sentiment integration
- [ ] Mobile app
- [ ] Telegram/Discord bot alerts

## License

MIT - Part of Mission Control
