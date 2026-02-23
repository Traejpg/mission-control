import { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  Bell,
  Activity,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Zap,
  Filter,
  Plus,
  CheckCircle2,
  XCircle,
  MoreHorizontal
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  positions, 
  marketData, 
  tradingSignals, 
  tradeDecisions, 
  pnlSummary, 
  alerts 
} from '../data/store';
import type { Position, MarketType, SignalType, SignalStrength } from '../types';

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatPercent = (value: number) => {
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
};

const getMarketIcon = (market: MarketType) => {
  switch (market) {
    case 'stock': return '📈';
    case 'option': return '⚡';
    case 'polymarket': return '🔮';
    case 'kalshi': return '📊';
    default: return '📈';
  }
};

const getSignalColor = (type: SignalType, strength: SignalStrength) => {
  const colors = {
    buy: {
      weak: 'bg-green-500/10 text-green-400 border-green-500/20',
      moderate: 'bg-green-500/20 text-green-400 border-green-500/30',
      strong: 'bg-green-500/30 text-green-300 border-green-500/40',
      critical: 'bg-green-500/40 text-green-200 border-green-500/50',
    },
    sell: {
      weak: 'bg-red-500/10 text-red-400 border-red-500/20',
      moderate: 'bg-red-500/20 text-red-400 border-red-500/30',
      strong: 'bg-red-500/30 text-red-300 border-red-500/40',
      critical: 'bg-red-500/40 text-red-200 border-red-500/50',
    },
    hold: {
      weak: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      strong: 'bg-yellow-500/30 text-yellow-300 border-yellow-500/40',
      critical: 'bg-yellow-500/40 text-yellow-200 border-yellow-500/50',
    },
    alert: {
      weak: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      moderate: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      strong: 'bg-orange-500/30 text-orange-300 border-orange-500/40',
      critical: 'bg-orange-500/40 text-orange-200 border-orange-500/50',
    },
  };
  return colors[type][strength];
};

// ==========================================
// COMPONENTS
// ==========================================

const PnLCard = ({ title, value, percent, icon: Icon, color }: any) => {
  const isPositive = value >= 0;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${color}-500/20`}>
          <Icon className={`w-5 h-5 text-${color}-400`} />
        </div>
        {isPositive ? (
          <ArrowUpRight className="w-5 h-5 text-green-400" />
        ) : (
          <ArrowDownRight className="w-5 h-5 text-red-400" />
        )}
      </div>
      <p className="text-gray-400 text-sm">{title}</p>
      <p className={`text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {formatCurrency(value)}
      </p>
      <p className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {formatPercent(percent)}
      </p>
    </motion.div>
  );
};

const PositionCard = ({ position }: { position: Position }) => {
  const isPositive = position.pnl >= 0;
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card-hover group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getMarketIcon(position.market)}</span>
          <div>
            <h4 className="font-bold">{position.symbol}</h4>
            <p className="text-xs text-gray-400 truncate max-w-[150px]">{position.name}</p>
          </div>
        </div>
        <span className={`badge ${position.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
          {position.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-400">Entry</p>
          <p className="font-medium">{formatCurrency(position.entryPrice)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Current</p>
          <p className="font-medium">{formatCurrency(position.currentPrice)}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-dark-600">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{position.quantity} shares</span>
        </div>
        <div className={`text-right ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          <p className="font-bold">{formatCurrency(position.pnl)}</p>
          <p className="text-xs">{formatPercent(position.pnlPercent)}</p>
        </div>
      </div>
      
      {(position.stopLoss || position.takeProfit) && (
        <div className="mt-3 pt-3 border-t border-dark-600 flex gap-3 text-xs">
          {position.stopLoss && (
            <span className="text-red-400">SL: {formatCurrency(position.stopLoss)}</span>
          )}
          {position.takeProfit && (
            <span className="text-green-400">TP: {formatCurrency(position.takeProfit)}</span>
          )}
        </div>
      )}
    </motion.div>
  );
};

const MarketTicker = ({ data }: { data: typeof marketData[0] }) => {
  const isPositive = data.change >= 0;
  
  return (
    <div className="flex items-center justify-between p-3 bg-dark-700/50 rounded-lg hover:bg-dark-700 transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-xl">{getMarketIcon(data.market)}</span>
        <div>
          <p className="font-medium">{data.symbol}</p>
          <p className="text-xs text-gray-400">{data.name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium">{formatCurrency(data.price)}</p>
        <p className={`text-xs flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {formatPercent(data.changePercent)}
        </p>
      </div>
    </div>
  );
};

const SignalCard = ({ signal }: { signal: typeof tradingSignals[0] }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 rounded-lg border ${getSignalColor(signal.type, signal.strength)}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getMarketIcon(signal.market)}</span>
          <span className="font-bold">{signal.symbol}</span>
        </div>
        <span className="text-xs uppercase font-medium">{signal.strength}</span>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg font-bold capitalize">{signal.type}</span>
        <span className="text-sm">@ {formatCurrency(signal.price)}</span>
      </div>
      
      <p className="text-sm opacity-80 mb-3">{signal.reasoning}</p>
      
      {(signal.targetPrice || signal.stopLoss) && (
        <div className="flex gap-4 text-xs mb-3">
          {signal.targetPrice && (
            <span className="text-green-400">🎯 Target: {formatCurrency(signal.targetPrice)}</span>
          )}
          {signal.stopLoss && (
            <span className="text-red-400">🛑 Stop: {formatCurrency(signal.stopLoss)}</span>
          )}
        </div>
      )}
      
      <div className="flex items-center justify-between pt-2 border-t border-current border-opacity-20">
        <span className="text-xs opacity-60">{signal.source}</span>
        <div className="flex gap-2">
          <button className="p-1 hover:bg-white/10 rounded">
            <CheckCircle2 className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-white/10 rounded">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const DecisionLog = ({ decision }: { decision: typeof tradeDecisions[0] }) => {
  const decisionColors = {
    enter: 'text-green-400',
    exit: 'text-red-400',
    hold: 'text-yellow-400',
    size_up: 'text-green-400',
    size_down: 'text-orange-400',
  };
  
  return (
    <div className="flex items-start gap-3 p-3 bg-dark-700/30 rounded-lg">
      <div className={`w-2 h-2 rounded-full mt-2 ${decision.outcome === 'profit' ? 'bg-green-400' : decision.outcome === 'loss' ? 'bg-red-400' : 'bg-yellow-400'}`} />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium">{decision.symbol}</span>
          <span className={`text-sm ${decisionColors[decision.decision]}`}>
            {decision.decision.replace('_', ' ')}
          </span>
        </div>
        <p className="text-sm text-gray-400 mb-2">{decision.reasoning}</p>
        <div className="flex flex-wrap gap-1 mb-2">
          {decision.factors.map(factor => (
            <span key={factor} className="text-xs px-2 py-0.5 bg-dark-600 rounded">
              {factor.replace('-', ' ')}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{new Date(decision.timestamp).toLocaleString()}</span>
          {decision.pnl !== undefined && (
            <span className={decision.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
              {formatCurrency(decision.pnl)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN PAGE
// ==========================================

export default function Trading() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'positions' | 'signals' | 'history'>('dashboard');
  const [filterMarket, setFilterMarket] = useState<MarketType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('open');
  
  const filteredPositions = positions.filter(p => {
    if (filterMarket !== 'all' && p.market !== filterMarket) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    return true;
  });
  
  const openPositions = positions.filter(p => p.status === 'open');
  const closedPositions = positions.filter(p => p.status === 'closed');
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-green-400" />
            Trading Bot
          </h1>
          <p className="text-gray-400 mt-1">Multi-market trading dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass px-4 py-2 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm">Live Data</span>
          </div>
          <button 
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Position
          </button>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-dark-600">
        {['dashboard', 'positions', 'signals', 'history'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab 
                ? 'text-brand-400 border-brand-400' 
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      
      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* P&L Summary Cards */}
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              P&L Summary
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <PnLCard 
                title="Total P&L" 
                value={pnlSummary.totalPnl} 
                percent={pnlSummary.totalPnlPercent}
                icon={BarChart3}
                color="green"
              />
              <PnLCard 
                title="Realized" 
                value={pnlSummary.realizedPnl} 
                percent={3.2}
                icon={CheckCircle2}
                color="blue"
              />
              <PnLCard 
                title="Unrealized" 
                value={pnlSummary.unrealizedPnl} 
                percent={5.1}
                icon={Activity}
                color="yellow"
              />
              <PnLCard 
                title="Today's P&L" 
                value={pnlSummary.dayPnl} 
                percent={2.8}
                icon={Zap}
                color="purple"
              />
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <p className="text-gray-400 text-sm">Win Rate</p>
              <p className="text-2xl font-bold text-brand-400">{pnlSummary.winRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">{pnlSummary.winningTrades}W / {pnlSummary.losingTrades}L</p>
            </div>
            <div className="card">
              <p className="text-gray-400 text-sm">Avg Win</p>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(pnlSummary.avgWin)}</p>
            </div>
            <div className="card">
              <p className="text-gray-400 text-sm">Avg Loss</p>
              <p className="text-2xl font-bold text-red-400">{formatCurrency(pnlSummary.avgLoss)}</p>
            </div>
            <div className="card">
              <p className="text-gray-400 text-sm">Profit Factor</p>
              <p className="text-2xl font-bold text-brand-400">{pnlSummary.profitFactor.toFixed(2)}</p>
            </div>
          </div>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Positions */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-brand-400" />
                  Active Positions ({openPositions.length})
                </h2>
                <button 
                  onClick={() => setActiveTab('positions')}
                  className="text-sm text-brand-400 hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {openPositions.slice(0, 4).map(position => (
                  <PositionCard key={position.id} position={position} />
                ))}
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-6">
              {/* Market Ticker */}
              <div className="card">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-brand-400" />
                  Market Watch
                </h3>
                <div className="space-y-2">
                  {marketData.slice(0, 5).map(data => (
                    <MarketTicker key={data.symbol} data={data} />
                  ))}
                </div>
              </div>
              
              {/* Alerts */}
              <div className="card">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-yellow-400" />
                  Alerts ({alerts.length})
                </h3>
                <div className="space-y-2">
                  {alerts.map(alert => (
                    <div key={alert.id} className="flex items-center justify-between p-2 bg-dark-700/50 rounded">
                      <span className="text-sm">{alert.symbol}</span>
                      <span className="text-xs text-gray-400">
                        {alert.condition} {alert.threshold}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Active Signals */}
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-400" />
              Active Signals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {tradingSignals.map(signal => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Positions Tab */}
      {activeTab === 'positions' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Filter:</span>
            </div>
            <select 
              value={filterMarket}
              onChange={(e) => setFilterMarket(e.target.value as MarketType | 'all')}
              className="input text-sm py-1.5"
            >
              <option value="all">All Markets</option>
              <option value="stock">Stocks</option>
              <option value="option">Options</option>
              <option value="polymarket">Polymarket</option>
              <option value="kalshi">Kalshi</option>
            </select>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'open' | 'closed')}
              className="input text-sm py-1.5"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          
          {/* Positions Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-400 border-b border-dark-600">
                  <th className="pb-3">Symbol</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Entry</th>
                  <th className="pb-3">Current</th>
                  <th className="pb-3">Quantity</th>
                  <th className="pb-3">P&L</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredPositions.map((position) => (
                  <tr key={position.id} className="border-b border-dark-700/50 hover:bg-dark-700/30">
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <span>{getMarketIcon(position.market)}</span>
                        <span className="font-medium">{position.symbol}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="capitalize">{position.type}</span>
                    </td>
                    <td className="py-4">{formatCurrency(position.entryPrice)}</td>
                    <td className="py-4">{formatCurrency(position.currentPrice)}</td>
                    <td className="py-4">{position.quantity}</td>
                    <td className="py-4">
                      <span className={position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {formatCurrency(position.pnl)} ({formatPercent(position.pnlPercent)})
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`badge ${position.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {position.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <button className="p-1 hover:bg-dark-600 rounded">
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Signals Tab */}
      {activeTab === 'signals' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tradingSignals.map(signal => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
          </div>
          
          {/* Signal History / Pending */}
          <div className="card">
            <h3 className="font-bold mb-4">Signal Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-dark-700/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Price Change Alert</p>
                <p className="text-2xl font-bold">5%</p>
                <p className="text-xs text-gray-500">Notify on ±5% moves</p>
              </div>
              <div className="p-4 bg-dark-700/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Volume Spike</p>
                <p className="text-2xl font-bold">2x</p>
                <p className="text-xs text-gray-500">Alert on 2x avg volume</p>
              </div>
              <div className="p-4 bg-dark-700/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Auto-Trading</p>
                <p className="text-2xl font-bold text-yellow-400">Off</p>
                <p className="text-xs text-gray-500">Manual execution only</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Trade Decision Log */}
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-400" />
              Decision Log
            </h2>
            <div className="space-y-3">
              {tradeDecisions.map(decision => (
                <DecisionLog key={decision.id} decision={decision} />
              ))}
            </div>
          </div>
          
          {/* Closed Positions */}
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              Closed Positions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {closedPositions.map(position => (
                <PositionCard key={position.id} position={position} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
