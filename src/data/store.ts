import { Task, Workflow, CalendarEvent, Memory, TeamMember, Command, LogEntry, UserProfile, Achievement } from '../types';

// User Profile - Real user data
export const userProfile: UserProfile = {
  name: 'Tee',
  role: 'CEO',
  company: 'TrackGiant + Personal Ventures',
  avatar: '👤',
  revenueGoals: {
    trackgiant: 50000,
    realEstate: 100000,
    aiAgency: 25000,
    stocks: 10000,
  },
};

// Workflows - Empty, to be populated with real data
export const workflows: Workflow[] = [
  {
    id: 'trackgiant',
    name: 'TrackGiant',
    description: 'Music marketplace marketing, dev, rollout',
    icon: 'music',
    color: 'purple',
    metrics: {
      activeTasks: 0,
      completedToday: 0,
      revenue: 0,
      progress: 0,
    },
    status: 'active',
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    description: 'Lead pipeline, intake, disposition, buyer assignments',
    icon: 'home',
    color: 'green',
    metrics: {
      activeTasks: 0,
      completedToday: 0,
      revenue: 0,
      progress: 0,
    },
    status: 'paused',
  },
  {
    id: 'ai-agency',
    name: 'AI Agency',
    description: 'Client onboarding, MRR, active assistants',
    icon: 'bot',
    color: 'blue',
    metrics: {
      activeTasks: 0,
      completedToday: 0,
      revenue: 0,
      progress: 0,
    },
    status: 'active',
  },
  {
    id: 'stocks',
    name: 'Stock Trading',
    description: 'Options plays, market monitoring',
    icon: 'trending-up',
    color: 'yellow',
    metrics: {
      activeTasks: 0,
      completedToday: 0,
      revenue: 0,
      progress: 0,
    },
    status: 'active',
  },
  {
    id: 'personal',
    name: 'Personal',
    description: 'Workouts, nutrition, KPI goals',
    icon: 'user',
    color: 'pink',
    metrics: {
      activeTasks: 0,
      completedToday: 0,
      progress: 0,
    },
    status: 'active',
  },
];

// Tasks - Empty, add real tasks via UI
export const tasks: Task[] = [];

// Calendar Events - Empty, add real events via UI
export const calendarEvents: CalendarEvent[] = [];

// Memories - Empty, populated from memory files
export const memories: Memory[] = [];

// Team Members - Real subagent roster, no mock tasks
export const teamMembers: TeamMember[] = [
  {
    id: 'robin',
    name: 'Robin',
    role: 'Chief of Staff / General Assistant',
    avatar: '🦇',
    status: 'online',
    skills: ['Strategy', 'Coding', 'Research', 'Writing', 'Automation'],
    workload: 0,
    lastActive: new Date(),
  },
  {
    id: 'stacksmith',
    name: 'StackSmith',
    role: 'Full-Stack Developer',
    avatar: '⚒️',
    status: 'idle',
    skills: ['React', 'Node.js', 'Databases', 'APIs', 'DevOps'],
    workload: 0,
    lastActive: new Date(),
  },
  {
    id: 'sage',
    name: 'Sage',
    role: 'Research Analyst',
    avatar: '🔍',
    status: 'idle',
    skills: ['Market Research', 'Data Analysis', 'Competitive Intel', 'Trends'],
    workload: 0,
    lastActive: new Date(),
  },
  {
    id: 'mythos',
    name: 'Mythos',
    role: 'Scriptwriter / Copywriter',
    avatar: '📜',
    status: 'idle',
    skills: ['Copywriting', 'Scripts', 'Email Sequences', 'Storytelling'],
    workload: 0,
    lastActive: new Date(),
  },
  {
    id: 'pulse',
    name: 'Pulse',
    role: 'Social Media Manager',
    avatar: '📱',
    status: 'idle',
    skills: ['Content Creation', 'Scheduling', 'Analytics', 'Community'],
    workload: 0,
    lastActive: new Date(),
  },
  {
    id: 'forge',
    name: 'Forge',
    role: 'AI Tools Engineer',
    avatar: '⚙️',
    status: 'idle',
    skills: ['ElevenLabs', 'OpenAI', 'Automation', 'Integrations'],
    workload: 0,
    lastActive: new Date(),
  },
  {
    id: 'ghost',
    name: 'GhostChannel',
    role: 'YouTube SEO Specialist',
    avatar: '👻',
    status: 'idle',
    skills: ['SEO', 'Thumbnails', 'Titles', 'Analytics'],
    workload: 0,
    lastActive: new Date(),
  },
  {
    id: 'ledger',
    name: 'Ledger',
    role: 'Monetization Strategist',
    avatar: '💰',
    status: 'idle',
    skills: ['Pricing', 'Revenue Models', 'MRR', 'Conversion'],
    workload: 0,
    lastActive: new Date(),
  },
];

// Commands - Empty, real-time execution only
export const commands: Command[] = [];

// Logs - Empty, populated from actual events
export const logs: LogEntry[] = [];

// ==========================================
// TRADING DATA - Empty, connect APIs for live data
// ==========================================

import type { Position, TradingSignal, TradeDecision, MarketData, PnLSummary, Alert } from '../types';

export const tradingConfig = {
  apiKeys: {
    polygon: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_POLYGON_API_KEY) || '',
    alpaca: '',
    polymarket: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_POLYMARKET_API_KEY) || '',
    kalshi: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_KALSHI_API_KEY) || '',
  },
  riskManagement: {
    maxPositionSize: 10000,
    maxDayLoss: 500,
    maxPortfolioRisk: 0.05,
    defaultStopLoss: 0.05,
    defaultTakeProfit: 0.10,
  },
  alerts: {
    priceChangeThreshold: 0.05,
    volumeSpikeThreshold: 2.0,
    enabled: true,
  },
};

// Empty - add real positions via UI or API sync
export const positions: Position[] = [];

// Empty - populated from live market data APIs
export const marketData: MarketData[] = [];

// Empty - generated from actual analysis
export const tradingSignals: TradingSignal[] = [];

// Empty - logged from actual decisions
export const tradeDecisions: TradeDecision[] = [];

// Empty - calculated from real positions
export const pnlSummary: PnLSummary = {
  totalPnl: 0,
  totalPnlPercent: 0,
  realizedPnl: 0,
  unrealizedPnl: 0,
  dayPnl: 0,
  weekPnl: 0,
  monthPnl: 0,
  winRate: 0,
  totalTrades: 0,
  winningTrades: 0,
  losingTrades: 0,
  avgWin: 0,
  avgLoss: 0,
  profitFactor: 0,
};

// Empty - user-created alerts only
export const alerts: Alert[] = [];

// Achievements - Empty, unlock based on real accomplishments
export const achievements: Achievement[] = [
  {
    id: 'ach-1',
    title: 'First Launch',
    description: 'Launch first business',
    icon: '🚀',
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'ach-2',
    title: 'Deal Closer',
    description: 'Close first deal',
    icon: '💰',
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'ach-3',
    title: 'Task Master',
    description: 'Complete 50 tasks',
    icon: '✅',
    progress: 0,
    maxProgress: 50,
  },
  {
    id: 'ach-4',
    title: 'Memory Keeper',
    description: 'Store 100 memories',
    icon: '🧠',
    progress: 0,
    maxProgress: 100,
  },
];
