// Mission Control Types

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  assignee: 'tee' | 'robin' | string;
  workflow: WorkflowType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  tags: string[];
  estimatedHours?: number;
  actualHours?: number;
  dependencies?: string[];
}

export type WorkflowType = 
  | 'trackgiant' 
  | 'real-estate' 
  | 'ai-agency' 
  | 'stocks' 
  | 'personal';

export interface Workflow {
  id: WorkflowType;
  name: string;
  description: string;
  icon: string;
  color: string;
  metrics: {
    activeTasks: number;
    completedToday: number;
    revenue?: number;
    progress: number;
  };
  status: 'active' | 'paused' | 'completed';
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  type: 'task' | 'reminder' | 'deadline' | 'meeting' | 'cron';
  workflow: WorkflowType;
  assignee?: string;
  completed?: boolean;
  recurring?: string;
}

export interface Memory {
  id: string;
  title: string;
  content: string;
  category: string;
  date: Date;
  tags: string[];
  source: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'online' | 'offline' | 'busy' | 'idle';
  currentTask?: string;
  skills: string[];
  workload: number;
  lastActive: Date;
}

export interface Command {
  id: string;
  command: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  output?: string;
  timestamp: Date;
  duration?: number;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface UserProfile {
  name: string;
  role: string;
  company: string;
  avatar: string;
  revenueGoals: {
    trackgiant: number;
    realEstate: number;
    aiAgency: number;
    stocks: number;
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
}

// Content Pipeline Types
export type ContentStage = 'ideas' | 'outline' | 'script' | 'visuals' | 'review' | 'publish';
export type ContentType = 'video' | 'blog' | 'social' | 'ad' | 'email' | 'podcast';
export type ContentPlatform = 'youtube' | 'tiktok' | 'instagram' | 'twitter' | 'linkedin' | 'blog' | 'email';

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  stage: ContentStage;
  type: ContentType;
  platform: ContentPlatform;
  workflow: WorkflowType;
  assignee: 'tee' | 'robin' | string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  updatedAt: Date;
  scheduledDate?: Date;
  publishedDate?: Date;
  tags: string[];
  
  // Content fields
  outline?: string;
  script?: string;
  notes?: string;
  
  // Media attachments
  images: ContentImage[];
  attachments: ContentAttachment[];
  
  // Publishing
  publishUrl?: string;
  analytics?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
}

export interface ContentImage {
  id: string;
  url: string;
  filename: string;
  size: number;
  uploadedAt: Date;
  caption?: string;
}

export interface ContentAttachment {
  id: string;
  filename: string;
  url: string;
  type: 'image' | 'video' | 'document' | 'audio';
  size: number;
  uploadedAt: Date;
}

// ==========================================
// TRADING TYPES
// ==========================================

export type MarketType = 'stock' | 'option' | 'polymarket' | 'kalshi';
export type PositionStatus = 'open' | 'closed' | 'pending';
export type SignalType = 'buy' | 'sell' | 'hold' | 'alert';
export type SignalStrength = 'weak' | 'moderate' | 'strong' | 'critical';

export interface Position {
  id: string;
  symbol: string;
  name: string;
  market: MarketType;
  type: 'long' | 'short' | 'call' | 'put' | 'binary';
  status: PositionStatus;
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  entryDate: Date;
  exitDate?: Date;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  pnl: number;
  pnlPercent: number;
  notes?: string;
  tags: string[];
  alerts: Alert[];
}

export interface Alert {
  id: string;
  positionId?: string;
  symbol: string;
  condition: 'above' | 'below' | 'percent_change' | 'volume_spike';
  threshold: number;
  triggered: boolean;
  triggeredAt?: Date;
  createdAt: Date;
}

export interface TradingSignal {
  id: string;
  symbol: string;
  market: MarketType;
  type: SignalType;
  strength: SignalStrength;
  price: number;
  targetPrice?: number;
  stopLoss?: number;
  reasoning: string;
  createdAt: Date;
  expiresAt?: Date;
  source: string;
  executed: boolean;
}

export interface TradeDecision {
  id: string;
  timestamp: Date;
  symbol: string;
  decision: 'enter' | 'exit' | 'hold' | 'size_up' | 'size_down';
  position?: Position;
  reasoning: string;
  factors: string[];
  confidence: number;
  outcome?: 'profit' | 'loss' | 'breakeven' | 'pending';
  pnl?: number;
}

export interface MarketData {
  symbol: string;
  name: string;
  market: MarketType;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high24h: number;
  low24h: number;
  marketCap?: number;
  lastUpdated: Date;
}

export interface PnLSummary {
  totalPnl: number;
  totalPnlPercent: number;
  realizedPnl: number;
  unrealizedPnl: number;
  dayPnl: number;
  weekPnl: number;
  monthPnl: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
}

export interface TradingConfig {
  apiKeys: {
    polygon?: string;
    alpaca?: string;
    polymarket?: string;
    kalshi?: string;
  };
  riskManagement: {
    maxPositionSize: number;
    maxDayLoss: number;
    maxPortfolioRisk: number;
    defaultStopLoss: number;
    defaultTakeProfit: number;
  };
  alerts: {
    priceChangeThreshold: number;
    volumeSpikeThreshold: number;
    enabled: boolean;
  };
}