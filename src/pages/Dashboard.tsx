import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Target,
  Zap,
  Activity,
  Wifi,
  WifiOff,
  Users,
  Brain,
  Terminal,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { workflows, tasks, achievements, teamMembers } from '../data/store';
import { 
  useWebSocketConnection, 
  useWebSocketSessions,
  webSocketService 
} from '../services/websocket';
import type { LiveSession } from '../services/gateway';

// Derive active agents from live sessions
function deriveActiveAgents(sessions: LiveSession[]): string[] {
  const active = new Set<string>();
  
  sessions.forEach(session => {
    const parts = session.key.split(':');
    if (parts.length >= 3 && parts[2] === 'subagent') {
      if (session.label) {
        const agentName = session.label.split(':')[0]?.trim();
        if (agentName) active.add(agentName.toLowerCase());
      }
    }
  });
  
  return Array.from(active);
}

// Format relative time
function formatLastUpdate(timestamp: number): string {
  if (!timestamp) return 'Never';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  // WebSocket connection
  const { isConnected } = useWebSocketConnection();
  const sessions = useWebSocketSessions();

  // Update last update time when sessions change
  useEffect(() => {
    setLastUpdate(Date.now());
  }, [sessions]);

  // Clock timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate live stats
  const activeAgents = deriveActiveAgents(sessions);
  const activeSubagents = activeAgents.length;
  
  const stats = {
    totalTasks: tasks.length,
    completedToday: tasks.filter(t => t.status === 'done').length,
    inProgress: activeSubagents,
    critical: tasks.filter(t => t.priority === 'critical' && t.status !== 'done').length,
  };

  const recentAchievements = achievements.filter(a => a.unlockedAt).slice(0, 3);
  
  // Live team with WebSocket data
  const liveTeam = teamMembers.map(member => {
    const isActive = activeAgents.includes(member.id.toLowerCase()) ||
                     activeAgents.includes(member.name.toLowerCase());
    
    const relatedSession = sessions.find(s => 
      s.label?.toLowerCase().includes(member.id.toLowerCase()) ||
      s.displayName.toLowerCase().includes(member.id.toLowerCase())
    );

    return {
      ...member,
      status: isActive ? ('busy' as const) : ('idle' as const),
      currentTask: relatedSession?.label || (isActive ? 'Working...' : undefined),
      workload: isActive ? 75 : 0,
      lastActive: isActive ? new Date() : member.lastActive,
    };
  });

  // Quick actions
  const quickActions = [
    { icon: Plus, label: 'New Task', color: 'bg-brand-600' },
    { icon: Terminal, label: 'Command', color: 'bg-purple-600' },
    { icon: Brain, label: 'Memory', color: 'bg-pink-600' },
    { icon: Users, label: 'Team', color: 'bg-green-600' },
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header with Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 lg:gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold">Mission Control</h1>
            <span className={`flex items-center gap-1 px-2 py-0.5 lg:py-1 rounded-full text-xs font-medium ${
              isConnected 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {isConnected ? (
                <><Wifi className="w-3 h-3" /><span className="hidden sm:inline">LIVE</span></>
              ) : (
                <><WifiOff className="w-3 h-3" /><span className="hidden sm:inline">OFF</span></>
              )}
            </span>
          </div>
          <p className="text-gray-400 mt-1 text-sm">
            {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            <span className="ml-2 text-xs text-gray-500">
              upd {formatLastUpdate(lastUpdate)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 lg:gap-4">
          {!isConnected && (
            <button 
              onClick={() => webSocketService.connect()}
              className="btn-secondary text-xs lg:text-sm px-3 py-1.5"
            >
              Reconnect
            </button>
          )}
          <div className="glass px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg flex items-center gap-2">
            <Zap className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-400" />
            <span className="font-mono text-lg lg:text-xl">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* Mobile Quick Actions FAB */}
      <div className="lg:hidden fixed bottom-20 right-4 z-40">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowQuickActions(!showQuickActions)}
          className="w-14 h-14 bg-brand-600 rounded-full flex items-center justify-center shadow-lg shadow-brand-600/30"
        >
          <Plus className="w-7 h-7 text-white" />
        </motion.button>
        
        <AnimatePresence>
          {showQuickActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="absolute bottom-16 right-0 flex flex-col gap-2"
            >
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`${action.color} w-12 h-12 rounded-full flex items-center justify-center shadow-lg`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Live Stats Grid - Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4 lg:p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs lg:text-sm">Total Tasks</p>
              <p className="text-2xl lg:text-3xl font-bold">{stats.totalTasks}</p>
            </div>
            <Target className="w-6 h-6 lg:w-8 lg:h-8 text-brand-400" />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-4 lg:p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs lg:text-sm">Completed</p>
              <p className="text-2xl lg:text-3xl font-bold text-green-400">{stats.completedToday}</p>
            </div>
            <CheckCircle2 className="w-6 h-6 lg:w-8 lg:h-8 text-green-400" />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card border-green-500/20 p-4 lg:p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs lg:text-sm flex items-center gap-1">
                Active
                {isConnected && <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />}
              </p>
              <p className="text-2xl lg:text-3xl font-bold text-green-400">{stats.inProgress}</p>
            </div>
            <Users className="w-6 h-6 lg:w-8 lg:h-8 text-green-400" />
          </div>
          {activeAgents.length > 0 && (
            <p className="text-xs text-gray-400 mt-2 truncate">
              {activeAgents.slice(0, 3).join(', ')}
              {activeAgents.length > 3 && ` +${activeAgents.length - 3}`}
            </p>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-4 lg:p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs lg:text-sm">Critical</p>
              <p className="text-2xl lg:text-3xl font-bold text-red-400">{stats.critical}</p>
            </div>
            <AlertCircle className="w-6 h-6 lg:w-8 lg:h-8 text-red-400" />
          </div>
        </motion.div>
      </div>

      {/* Live Sessions - Mobile Optimized */}
      {sessions.length > 0 && (
        <div className="card border-brand-500/30 p-4 lg:p-6">
          <h3 className="font-bold text-base lg:text-lg mb-3 lg:mb-4 flex items-center gap-2">
            <Terminal className="w-4 h-4 lg:w-5 lg:h-5 text-brand-400" />
            Live Sessions ({sessions.length})
            {isConnected && (
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {sessions.map((session) => (
              <div 
                key={session.key} 
                className="flex items-center justify-between p-2 lg:p-3 bg-dark-700/50 rounded-lg text-sm hover:bg-dark-700 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
                  <span className="font-medium truncate">{session.displayName}</span>
                </div>
                <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-400 truncate max-w-[100px] lg:max-w-none">
                    {session.label || session.kind}
                  </span>
                  <span className="text-xs text-gray-500 hidden sm:inline">
                    {new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workflows Grid - Responsive */}
      <div>
        <h2 className="text-lg lg:text-xl font-bold mb-3 lg:mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 lg:w-5 lg:h-5 text-brand-400" />
          Active Workflows
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {workflows.map((workflow, index) => (
            <motion.div
              key={workflow.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileTap={{ scale: 0.98 }}
              className="card-hover group cursor-pointer p-4 lg:p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center bg-${workflow.color}-500/20`}>
                  <span className="text-lg lg:text-2xl">
                    {workflow.icon === 'music' && '🎵'}
                    {workflow.icon === 'home' && '🏠'}
                    {workflow.icon === 'bot' && '🤖'}
                    {workflow.icon === 'trending-up' && '📈'}
                    {workflow.icon === 'user' && '👤'}
                  </span>
                </div>
                <span className={`badge text-xs ${
                  workflow.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  workflow.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {workflow.status}
                </span>
              </div>
              <h3 className="font-bold text-base lg:text-lg mb-1">{workflow.name}</h3>
              <p className="text-xs lg:text-sm text-gray-400 mb-4">{workflow.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs lg:text-sm">
                  <span className="text-gray-400">Progress</span>
                  <span className="font-medium">{workflow.metrics.progress}%</span>
                </div>
                <div className="h-1.5 lg:h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-${workflow.color}-500 rounded-full transition-all`}
                    style={{ width: `${workflow.metrics.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 pt-2">
                  <span>{workflow.metrics.activeTasks} active</span>
                  <span>{workflow.metrics.completedToday} today</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Row - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Live Team Status */}
        <div className="card p-4 lg:p-6">
          <h3 className="font-bold text-base lg:text-lg mb-3 lg:mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 lg:w-5 lg:h-5 text-brand-400" />
            Live Team
            {isConnected && (
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {liveTeam.filter(m => m.status === 'busy').map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-lg border border-green-500/20">
                <span className="text-xl lg:text-2xl">{member.avatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm lg:text-base">{member.name}</p>
                  <p className="text-xs text-gray-400 truncate">{member.currentTask}</p>
                </div>
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
              </div>
            ))}
            {liveTeam.filter(m => m.status === 'busy').length === 0 && (
              <div className="text-center py-6 lg:py-8">
                <p className="text-gray-400 text-sm">No active agents</p>
                {!isConnected && (
                  <p className="text-xs text-gray-500 mt-1">Connect to Gateway to see live status</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="card p-4 lg:p-6">
          <h3 className="font-bold text-base lg:text-lg mb-3 lg:mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-400" />
            Achievements
          </h3>
          <div className="space-y-3">
            {recentAchievements.length > 0 ? (
              recentAchievements.map((ach) => (
                <div key={ach.id} className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-lg">
                  <span className="text-xl lg:text-2xl">{ach.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm lg:text-base">{ach.title}</p>
                    <p className="text-xs lg:text-sm text-gray-400">{ach.description}</p>
                  </div>
                  <span className="text-xs text-green-400 flex-shrink-0">Unlocked!</span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 lg:py-8">
                <p className="text-gray-400 text-sm">No achievements yet</p>
                <p className="text-xs text-gray-500 mt-1">Complete tasks to unlock</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connection Status Footer - Compact on Mobile */}
      <div className={`p-3 lg:p-4 rounded-lg border ${
        isConnected 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-red-500/10 border-red-500/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 lg:gap-3">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 lg:w-5 lg:h-5 text-green-400" />
                <div>
                  <p className="font-medium text-green-400 text-sm">Connected</p>
                  <p className="text-xs text-gray-400 hidden sm:block">Real-time updates active</p>
                </div>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 lg:w-5 lg:h-5 text-red-400" />
                <div>
                  <p className="font-medium text-red-400 text-sm">Disconnected</p>
                  <p className="text-xs text-gray-400 hidden sm:block">Attempting to reconnect...</p>
                </div>
              </>
            )}
          </div>
          <div className="text-right text-xs text-gray-500">
            <p className="hidden sm:block">{import.meta.env.VITE_GATEWAY_URL || 'ws://127.0.0.1:18789'}</p>
            <p>{sessions.length} sessions</p>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Padding for Nav */}
      <div className="h-16 lg:hidden" />
    </div>
  );
}
