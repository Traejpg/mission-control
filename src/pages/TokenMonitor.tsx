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
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// Mock token usage data
const DAILY_USAGE_DATA = [
  { day: 'Mon', tokens: 45000, cost: 2.25, subagents: 3 },
  { day: 'Tue', tokens: 62000, cost: 3.10, subagents: 5 },
  { day: 'Wed', tokens: 38000, cost: 1.90, subagents: 2 },
  { day: 'Thu', tokens: 89000, cost: 4.45, subagents: 8 },
  { day: 'Fri', tokens: 52000, cost: 2.60, subagents: 4 },
  { day: 'Sat', tokens: 28000, cost: 1.40, subagents: 2 },
  { day: 'Sun', tokens: 34000, cost: 1.70, subagents: 3 },
];

// Subagent utilization data
const SUBAGENT_DATA = [
  { name: 'Robin', tasks: 45, tokens: 125000, cost: 6.25, efficiency: 92 },
  { name: 'Sage', tasks: 23, tokens: 89000, cost: 4.45, efficiency: 88 },
  { name: 'Mythos', tasks: 18, tokens: 76000, cost: 3.80, efficiency: 85 },
  { name: 'Pulse', tasks: 31, tokens: 45000, cost: 2.25, efficiency: 90 },
  { name: 'StackSmith', tasks: 12, tokens: 156000, cost: 7.80, efficiency: 95 },
  { name: 'GhostChannel', tasks: 8, tokens: 34000, cost: 1.70, efficiency: 87 },
];

// Usage by workflow
const WORKFLOW_USAGE = [
  { name: 'TrackGiant', value: 35, color: '#8b5cf6' },
  { name: 'AI Agency', value: 28, color: '#3b82f6' },
  { name: 'Real Estate', value: 15, color: '#22c55e' },
  { name: 'Personal', value: 12, color: '#f472b6' },
  { name: 'Stocks', value: 10, color: '#eab308' },
];

// Alerts configuration
const ALERTS = [
  { id: 1, type: 'warning', message: 'Daily spend approaching $5 limit', threshold: 4.50, current: 4.45 },
  { id: 2, type: 'info', message: 'StackSmith using high compute (coding tasks)', threshold: null, current: null },
  { id: 3, type: 'success', message: 'Yesterday 23% under budget', threshold: null, current: null },
];

interface DailyStats {
  tokens: number;
  cost: number;
  subagentTasks: number;
  avgCostPerTask: number;
}

export default function TokenMonitor() {
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    tokens: 52340,
    cost: 2.62,
    subagentTasks: 5,
    avgCostPerTask: 0.52,
  });
  const [weeklyBudget, setWeeklyBudget] = useState(20);
  const [dailyBudget, setDailyBudget] = useState(5);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

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

  const totalWeeklyCost = DAILY_USAGE_DATA.reduce((sum, d) => sum + d.cost, 0);
  const avgDailyCost = totalWeeklyCost / 7;
  const budgetRemaining = weeklyBudget - totalWeeklyCost;
  const dailyBudgetUsed = (dailyStats.cost / dailyBudget) * 100;

  const refreshData = () => {
    setLastRefresh(new Date());
    setDailyStats(prev => ({
      ...prev,
      tokens: prev.tokens + Math.floor(Math.random() * 500),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center">
            <Coins className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Token Usage Monitor</h1>
            <p className="text-gray-400">AI efficiency & cost tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <button 
            onClick={refreshData}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Alerts */}
      {ALERTS.map((alert) => (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`card border-l-4 ${
            alert.type === 'warning' ? 'border-l-yellow-500 bg-yellow-500/10' :
            alert.type === 'success' ? 'border-l-green-500 bg-green-500/10' :
            'border-l-blue-500 bg-blue-500/10'
          }`}
        >
          <div className="flex items-center gap-3">
            {alert.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-yellow-400" /> :
             alert.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-400" /> :
             <Zap className="w-5 h-5 text-blue-400" />}
            <p className={alert.type === 'warning' ? 'text-yellow-400' : alert.type === 'success' ? 'text-green-400' : 'text-blue-400'}>
              {alert.message}
            </p>
            {alert.threshold && (
              <span className="ml-auto text-sm text-gray-400">
                ${alert.current?.toFixed(2)} / ${alert.threshold.toFixed(2)}
              </span>
            )}
          </div>
        </motion.div>
      ))}

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Today's Tokens</span>
            <Activity className="w-5 h-5 text-brand-400" />
          </div>
          <p className="text-3xl font-bold">{dailyStats.tokens.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2 text-green-400 text-sm">
            <ArrowDownRight className="w-4 h-4" />
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
            <span className="text-gray-400">Today's Cost</span>
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold">${dailyStats.cost.toFixed(2)}</p>
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Daily budget</span>
              <span>{dailyBudgetUsed.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
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
            <span className="text-gray-400">Weekly Budget</span>
            <BarChart3 className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-bold">${budgetRemaining.toFixed(2)}</p>
          <p className="text-sm text-gray-400 mt-2">
            ${totalWeeklyCost.toFixed(2)} spent of ${weeklyBudget}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Subagent Tasks</span>
            <Users className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-3xl font-bold">{dailyStats.subagentTasks}</p>
          <p className="text-sm text-gray-400 mt-2">
            ${dailyStats.avgCostPerTask.toFixed(2)} avg per task
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Cost Trend Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-2 card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-brand-400" />
              Daily Cost Trend
            </h2>
            <select 
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="input text-sm py-1"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DAILY_USAGE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121212', border: '1px solid #2a2a2a' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
                />
                <Line 
                  type="monotone" 
                  dataKey="cost" 
                  stroke="#0ea5e9" 
                  strokeWidth={2}
                  dot={{ fill: '#0ea5e9', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Usage by Workflow */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <h2 className="text-xl font-bold mb-4">Usage by Workflow</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={WORKFLOW_USAGE}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={false}
                >
                  {WORKFLOW_USAGE.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#121212', border: '1px solid #2a2a2a' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Subagent Utilization */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            Subagent Utilization
          </h2>
          <span className="text-sm text-gray-400">Last 7 days</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="text-left py-3 px-4 font-medium text-gray-400">Agent</th>
                <th className="text-center py-3 px-4 font-medium text-gray-400">Tasks</th>
                <th className="text-center py-3 px-4 font-medium text-gray-400">Tokens</th>
                <th className="text-center py-3 px-4 font-medium text-gray-400">Cost</th>
                <th className="text-center py-3 px-4 font-medium text-gray-400">Efficiency</th>
                <th className="text-right py-3 px-4 font-medium text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {SUBAGENT_DATA.map((agent, index) => (
                <tr key={agent.name} className="border-b border-dark-600/50 hover:bg-dark-700/30">
                  <td className="py-3 px-4 font-medium">{agent.name}</td>
                  <td className="py-3 px-4 text-center">{agent.tasks}</td>
                  <td className="py-3 px-4 text-center">{agent.tokens.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">${agent.cost.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            agent.efficiency >= 90 ? 'bg-green-500' :
                            agent.efficiency >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${agent.efficiency}%` }}
                        />
                      </div>
                      <span className="text-sm w-10">{agent.efficiency}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`badge ${
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

      {/* Efficiency Metrics */}
      <div className="grid grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Value vs Waste
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">High-leverage tasks</span>
                <span className="text-green-400">78%</span>
              </div>
              <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '78%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Busywork/iterations</span>
                <span className="text-yellow-400">15%</span>
              </div>
              <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full" style={{ width: '15%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
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
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Peak Usage Hours
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-dark-700/50 rounded-lg">
              <span className="text-gray-400">8am - 12pm</span>
              <span className="font-medium">42%</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-dark-700/50 rounded-lg">
              <span className="text-gray-400">12pm - 4pm</span>
              <span className="font-medium">35%</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-dark-700/50 rounded-lg">
              <span className="text-gray-400">4pm - 8pm</span>
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
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-green-400" />
            Cost Savings Tips
          </h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
              Batch similar tasks to reduce context switching
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
              Use cached responses for repeated queries
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
              Set token limits on long-running subagents
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
              Review and cancel idle subagent sessions
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
