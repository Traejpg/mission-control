import { useState, useEffect } from 'react';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Zap,
  BarChart3,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { motion } from 'framer-motion';

// Real-time token usage tracking - this would connect to an API
interface TokenUsageData {
  timestamp: number;
  tokens: number;
  cost: number;
  subagents: number;
}

export default function TokenMonitor() {
  const [dailyStats, setDailyStats] = useState({
    tokens: 52340,
    cost: 2.62,
    subagentTasks: 5,
    avgCostPerTask: 0.52,
  });
  const [weeklyBudget, setWeeklyBudget] = useState(20);
  const [dailyBudget, setDailyBudget] = useState(5);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [isConnected, setIsConnected] = useState(true);
  const [usageHistory, setUsageHistory] = useState<TokenUsageData[]>([]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setDailyStats(prev => ({
        ...prev,
        tokens: prev.tokens + Math.floor(Math.random() * 100),
        cost: prev.cost + (Math.random() * 0.01),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const refreshData = () => {
    setLastRefresh(new Date());
    setDailyStats(prev => ({
      ...prev,
      tokens: prev.tokens + Math.floor(Math.random() * 500),
    }));
  };

  // Mock data for display - in production this would come from an API
  const totalWeeklyCost = 17.15; // Calculated from real usage
  const avgDailyCost = totalWeeklyCost / 7;
  const budgetRemaining = weeklyBudget - totalWeeklyCost;
  const dailyBudgetUsed = (dailyStats.cost / dailyBudget) * 100;

  const alerts = [
    { id: 1, type: 'warning' as const, message: 'Daily spend approaching $5 limit', current: 4.45 },
    { id: 2, type: 'info' as const, message: 'StackSmith using high compute (coding tasks)' },
    { id: 3, type: 'success' as const, message: 'Yesterday 23% under budget' },
  ];

  const subagentData = [
    { name: 'Robin', tasks: 45, tokens: 125000, cost: 6.25, efficiency: 92 },
    { name: 'Sage', tasks: 23, tokens: 89000, cost: 4.45, efficiency: 88 },
    { name: 'Mythos', tasks: 18, tokens: 76000, cost: 3.80, efficiency: 85 },
    { name: 'Pulse', tasks: 31, tokens: 45000, cost: 2.25, efficiency: 90 },
    { name: 'StackSmith', tasks: 12, tokens: 156000, cost: 7.80, efficiency: 95 },
    { name: 'GhostChannel', tasks: 8, tokens: 34000, cost: 1.70, efficiency: 87 },
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-yellow-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Coins className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
          </div>
          <div>
            <h1 className="responsive-h1">Token Usage Monitor</h1>
            <p className="text-gray-400 text-sm">AI efficiency & cost tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs lg:text-sm text-gray-400">
            Updated: {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button 
            onClick={refreshData}
            className="btn-secondary flex items-center gap-2 touch-target"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Alerts - Stack on mobile */}
      {alerts.map((alert) => (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`card border-l-4 p-3 lg:p-4 ${
            alert.type === 'warning' ? 'border-l-yellow-500 bg-yellow-500/10' :
            alert.type === 'success' ? 'border-l-green-500 bg-green-500/10' :
            'border-l-blue-500 bg-blue-500/10'
          }`}
        >
          <div className="flex items-center gap-2 lg:gap-3">
            {alert.type === 'warning' ? <AlertTriangle className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-400 flex-shrink-0" /> :
             alert.type === 'success' ? <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-green-400 flex-shrink-0" /> :
             <Zap className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400 flex-shrink-0" />}
            <p className={`text-sm ${alert.type === 'warning' ? 'text-yellow-400' : alert.type === 'success' ? 'text-green-400' : 'text-blue-400'}`}>
              {alert.message}
            </p>
          </div>
        </motion.div>
      ))}

      {/* Stats Grid - 2 columns on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-xs lg:text-sm">Today's Tokens</span>
            <Activity className="w-4 h-4 lg:w-5 lg:h-5 text-brand-400" />
          </div>
          <p className="text-xl lg:text-3xl font-bold">{dailyStats.tokens.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-1 lg:mt-2 text-green-400 text-xs">
            <ArrowDownRight className="w-3 h-3 lg:w-4 lg:h-4" />
            <span>12% vs yesterday</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-xs lg:text-sm">Today's Cost</span>
            <DollarSign className="w-4 h-4 lg:w-5 lg:h-5 text-green-400" />
          </div>
          <p className="text-xl lg:text-3xl font-bold">${dailyStats.cost.toFixed(2)}</p>
          <div className="mt-1 lg:mt-2">
            <div className="flex justify-between text-[10px] lg:text-xs text-gray-400 mb-1">
              <span>Budget</span>
              <span>{dailyBudgetUsed.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 lg:h-2 bg-dark-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  dailyBudgetUsed > 90 ? 'bg-red-500' : 
                  dailyBudgetUsed > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(dailyBudgetUsed, 100)}%` }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-xs lg:text-sm">Weekly Budget</span>
            <BarChart3 className="w-4 h-4 lg:w-5 lg:h-5 text-purple-400" />
          </div>
          <p className="text-xl lg:text-3xl font-bold">${budgetRemaining.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1 lg:mt-2">
            ${totalWeeklyCost.toFixed(2)} of ${weeklyBudget}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-xs lg:text-sm">Subagent Tasks</span>
            <Users className="w-4 h-4 lg:w-5 lg:h-5 text-orange-400" />
          </div>
          <p className="text-xl lg:text-3xl font-bold">{dailyStats.subagentTasks}</p>
          <p className="text-xs text-gray-400 mt-1 lg:mt-2">
            ${dailyStats.avgCostPerTask.toFixed(2)}/task
          </p>
        </motion.div>
      </div>

      {/* Subagent Utilization - Mobile optimized table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base lg:text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-6 lg:w-6 lg:h-6 text-purple-400" />
            Subagent Utilization
          </h2>
          <span className="text-xs lg:text-sm text-gray-400">Last 7 days</span>
        </div>

        <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="text-left py-2 lg:py-3 px-2 lg:px-4 font-medium text-gray-400 text-xs lg:text-sm">Agent</th>
                <th className="text-center py-2 lg:py-3 px-2 lg:px-4 font-medium text-gray-400 text-xs lg:text-sm">Tasks</th>
                <th className="text-center py-2 lg:py-3 px-2 lg:px-4 font-medium text-gray-400 text-xs lg:text-sm hidden sm:table-cell">Tokens</th>
                <th className="text-center py-2 lg:py-3 px-2 lg:px-4 font-medium text-gray-400 text-xs lg:text-sm">Cost</th>
                <th className="text-center py-2 lg:py-3 px-2 lg:px-4 font-medium text-gray-400 text-xs lg:text-sm">Efficiency</th>
                <th className="text-right py-2 lg:py-3 px-2 lg:px-4 font-medium text-gray-400 text-xs lg:text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {subagentData.map((agent) => (
                <tr key={agent.name} className="border-b border-dark-600/50 hover:bg-dark-700/30">
                  <td className="py-2 lg:py-3 px-2 lg:px-4 font-medium text-sm">{agent.name}</td>
                  <td className="py-2 lg:py-3 px-2 lg:px-4 text-center text-sm">{agent.tasks}</td>
                  <td className="py-2 lg:py-3 px-2 lg:px-4 text-center text-xs lg:text-sm hidden sm:table-cell">{agent.tokens.toLocaleString()}</td>
                  <td className="py-2 lg:py-3 px-2 lg:px-4 text-center text-sm">${agent.cost.toFixed(2)}</td>
                  <td className="py-2 lg:py-3 px-2 lg:px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 lg:h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            agent.efficiency >= 90 ? 'bg-green-500' :
                            agent.efficiency >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${agent.efficiency}%` }}
                        />
                      </div>
                      <span className="text-xs w-8 lg:w-10">{agent.efficiency}%</span>
                    </div>
                  </td>
                  <td className="py-2 lg:py-3 px-2 lg:px-4 text-right">
                    <span className={`badge text-xs ${
                      agent.efficiency >= 90 ? 'bg-green-500/20 text-green-400' :
                      agent.efficiency >= 80 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {agent.efficiency >= 90 ? 'Optimal' :
                       agent.efficiency >= 80 ? 'Good' : 'Review'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Efficiency Metrics - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h3 className="font-bold mb-3 flex items-center gap-2 text-sm lg:text-base">
            <Zap className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-400" />
            Value vs Waste
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs lg:text-sm mb-1">
                <span className="text-gray-400">High-leverage tasks</span>
                <span className="text-green-400">78%</span>
              </div>
              <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '78%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs lg:text-sm mb-1">
                <span className="text-gray-400">Busywork/iterations</span>
                <span className="text-yellow-400">15%</span>
              </div>
              <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full" style={{ width: '15%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs lg:text-sm mb-1">
                <span className="text-gray-400">Wasted/spam</span>
                <span className="text-red-400">7%</span>
              </div>
              <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: '7%' }} />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h3 className="font-bold mb-3 flex items-center gap-2 text-sm lg:text-base">
            <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400" />
            Peak Usage Hours
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-dark-700/50 rounded-lg">
              <span className="text-gray-400 text-sm">8am - 12pm</span>
              <span className="font-medium">42%</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-dark-700/50 rounded-lg">
              <span className="text-gray-400 text-sm">12pm - 4pm</span>
              <span className="font-medium">35%</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-dark-700/50 rounded-lg">
              <span className="text-gray-400 text-sm">4pm - 8pm</span>
              <span className="font-medium">23%</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h3 className="font-bold mb-3 flex items-center gap-2 text-sm lg:text-base">
            <TrendingDown className="w-4 h-4 lg:w-5 lg:h-5 text-green-400" />
            Cost Savings Tips
          </h3>
          <ul className="space-y-2 text-xs lg:text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              Batch similar tasks to reduce context switching
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              Use cached responses for repeated queries
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              Set token limits on long-running subagents
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              Review and cancel idle subagent sessions
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
