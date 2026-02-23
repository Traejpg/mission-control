import { useState, useEffect } from 'react';
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Users, 
  Phone, 
  MessageSquare, 
  UserCog,
  FileText,
  Save,
  History,
  ExternalLink,
  AlertTriangle,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';

// Rule definitions with full protocol descriptions
const RULES = [
  {
    id: 'delegation',
    category: 'Task Management',
    title: 'Task Delegation Protocol',
    icon: Users,
    description: 'All subagent delegation requires explicit user approval before execution.',
    steps: ['1. Robin Proposes', '2. User Confirms', '3. Robin Plans', '4. You Approve', '5. Delegate & Execute', '6. Progress Updates', '7. Completion Report'],
    status: 'active',
    lastUpdated: '2026-02-17',
    source: 'MEMORY.md - Operating Protocol',
    critical: true,
  },
  {
    id: 'calling',
    category: 'Safety',
    title: 'Lead Calling Safety Lock',
    icon: Phone,
    description: 'Sequential calling only - NEVER batch call leads. One at a time, wait for completion.',
    steps: ['Call Lead 1 → Wait for result', 'Then Call Lead 2 → Wait for result', 'Never spawn subagents for calling', 'User must direct each call individually'],
    status: 'active',
    lastUpdated: '2026-02-18',
    source: 'MEMORY.md - Operating Rules',
    critical: true,
  },
  {
    id: 'sms',
    category: 'Notifications',
    title: 'SMS Alert System',
    icon: MessageSquare,
    description: 'SMS alerts configured for ALL call outcomes (not just transfers).',
    steps: ['HOT Transfer', 'Voicemail Left', 'No Answer', 'Busy Signal', 'Call Failed', 'Call Completed'],
    status: 'active',
    lastUpdated: '2026-02-18',
    source: 'MEMORY.md - Operating Rules',
    critical: false,
  },
  {
    id: 'chief-of-staff',
    category: 'Daily Operations',
    title: 'Chief of Staff Protocol',
    icon: UserCog,
    description: '24/7 Executive Assistant with 5 daily check-ins and health tracking.',
    steps: ['8am - Morning Briefing', '12pm - Midday Check-In', '4pm - Afternoon Push', '6pm - Health Check', '8pm - Nightly Debrief'],
    status: 'active',
    lastUpdated: '2026-02-16',
    source: 'MEMORY.md - Chief of Staff Protocol',
    critical: true,
  },
  {
    id: 'chunks',
    category: 'Task Management',
    title: 'Chunk Size Guidelines',
    icon: FileText,
    description: 'Maximum task sizes to prevent timeouts and ensure quality.',
    steps: ['Research: 1 topic/source per chunk', 'Writing: 1 scene/section per chunk', 'Coding: 1 feature/module per chunk', 'Analysis: 1 dataset/metric per chunk'],
    status: 'active',
    lastUpdated: '2026-02-17',
    source: 'MEMORY.md - Operating Protocol',
    critical: false,
  },
  {
    id: 'communication',
    category: 'Communication',
    title: 'Communication Protocol',
    icon: MessageSquare,
    description: 'Standardized messaging format for all subagent delegation.',
    steps: ['START: "Delegating [task] to [agent]... ETA: [time]"', 'PROGRESS: Updates as chunks complete', 'FINISH: "✅ [Task] complete. [Summary]"'],
    status: 'active',
    lastUpdated: '2026-02-17',
    source: 'MEMORY.md - Operating Protocol',
    critical: false,
  },
  {
    id: 'auto-logging',
    category: 'Task Management',
    title: 'Task Auto-Logging',
    icon: Save,
    description: 'CRITICAL: All task lists and overnight work must be logged immediately.',
    steps: ['Save to memory/YYYY-MM-DD.md with timestamp', 'Log to MEMORY.md if multi-day/project scope', 'Confirm back to user with summary', 'Convert to actionable items with ownership'],
    status: 'active',
    lastUpdated: '2026-02-21',
    source: 'MEMORY.md - Important Decisions',
    critical: true,
  },
  {
    id: 'file-sharing',
    category: 'Security',
    title: 'File Sharing Protocol',
    icon: ExternalLink,
    description: 'Telegram file sharing security requirements.',
    steps: ['Files must be in $TMPDIR for Telegram access', 'Browse workspace → Copy to $TMPDIR', 'Generate proper media path', 'Send with confirmation'],
    status: 'active',
    lastUpdated: '2026-02-21',
    source: 'New Protocol',
    critical: false,
  },
  {
    id: 'task-completion-alerts',
    category: 'Communication',
    title: 'Task Completion Alerts',
    icon: MessageSquare,
    description: 'ALWAYS message user with updates on ANY completed task by Robin or subagents.',
    steps: ['Immediately upon task completion → Send message to user', 'Include: Task name, agent who completed it, summary of deliverables', 'No silent completions - every task gets a notification', 'Applies to: Robin (main), StackSmith, Sage, Mythos, Pulse, Forge, Ghost, Ledger, all subagents'],
    status: 'active',
    lastUpdated: '2026-02-22',
    source: 'User Directive',
    critical: true,
  },
];

interface RuleVersion {
  date: string;
  change: string;
  author: string;
}

const RULE_HISTORY: Record<string, RuleVersion[]> = {
  delegation: [
    { date: '2026-02-17', change: 'Added explicit approval requirement', author: 'Robin' },
    { date: '2026-02-16', change: 'Initial protocol defined', author: 'Robin' },
  ],
  calling: [
    { date: '2026-02-18', change: 'SMS alerts expanded to all outcomes', author: 'Robin' },
    { date: '2026-02-18', change: 'Sequential calling rule enforced', author: 'Robin' },
  ],
  'chief-of-staff': [
    { date: '2026-02-16', change: 'Protocol activated', author: 'Robin' },
  ],
  'auto-logging': [
    { date: '2026-02-21', change: 'CRITICAL flag added', author: 'Robin' },
  ],
  'task-completion-alerts': [
    { date: '2026-02-22', change: 'New rule: Always notify on task completion', author: 'Batman' },
  ],
};

export default function RulesEngine() {
  const [activeRules, setActiveRules] = useState<Set<string>>(new Set(RULES.filter(r => r.status === 'active').map(r => r.id)));
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const toggleRule = (ruleId: string) => {
    setActiveRules(prev => {
      const next = new Set(prev);
      if (next.has(ruleId)) {
        next.delete(ruleId);
      } else {
        next.add(ruleId);
      }
      return next;
    });
  };

  const activeCount = activeRules.size;
  const criticalCount = RULES.filter(r => r.critical && activeRules.has(r.id)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Rules Engine</h1>
            <p className="text-gray-400">Active protocols and safety controls</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-green-400">{activeCount}</p>
            <p className="text-xs text-gray-400">Active Rules</p>
          </div>
          <div className="w-px h-10 bg-dark-600" />
          <div className="text-right">
            <p className="text-2xl font-bold text-red-400">{criticalCount}</p>
            <p className="text-xs text-gray-400">Critical</p>
          </div>
        </div>
      </div>

      {/* Critical Warning */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card border-l-4 border-l-red-500 bg-red-500/10"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">
            <strong>Critical rules cannot be disabled:</strong> Task Delegation, Lead Calling Safety, and Auto-Logging are mandatory safety controls.
          </p>
        </div>
      </motion.div>

      {/* Rules Grid */}
      <div className="grid grid-cols-2 gap-4">
        {RULES.map((rule, index) => {
          const isActive = activeRules.has(rule.id);
          const Icon = rule.icon;
          
          return (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`card border-l-4 transition-all ${
                isActive 
                  ? rule.critical 
                    ? 'border-l-red-500 bg-red-500/5' 
                    : 'border-l-green-500 bg-green-500/5'
                  : 'border-l-gray-500 bg-dark-800 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    isActive ? 'bg-dark-700' : 'bg-dark-600'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      isActive ? 'text-brand-400' : 'text-gray-500'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{rule.title}</h3>
                      {rule.critical && (
                        <span className="badge bg-red-500/20 text-red-400 text-xs">CRITICAL</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{rule.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => !rule.critical && toggleRule(rule.id)}
                  disabled={rule.critical}
                  className={`transition-colors ${rule.critical ? 'cursor-not-allowed opacity-50' : 'hover:scale-105'}`}
                >
                  {isActive ? (
                    <ToggleRight className="w-8 h-8 text-green-400" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-500" />
                  )}
                </button>
              </div>

              <p className="text-sm text-gray-300 mt-3">{rule.description}</p>

              <div className="mt-4 space-y-1">
                {rule.steps.slice(0, 3).map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-400">
                    <ChevronRight className="w-4 h-4" />
                    <span>{step}</span>
                  </div>
                ))}
                {rule.steps.length > 3 && (
                  <p className="text-xs text-gray-500 ml-6">+{rule.steps.length - 3} more steps</p>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-600">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  Updated: {rule.lastUpdated}
                </div>
                <button 
                  onClick={() => { setSelectedRule(rule.id); setShowHistory(true); }}
                  className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
                >
                  <History className="w-3 h-3" />
                  History
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Rule History Modal */}
      {showHistory && selectedRule && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowHistory(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-dark-800 rounded-2xl border border-dark-600 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-dark-600">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-brand-400" />
                  Rule History
                </h3>
                <button onClick={() => setShowHistory(false)}>
                  <XCircle className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {RULE_HISTORY[selectedRule]?.map((version, idx) => (
                <div key={idx} className="flex items-start gap-4 pb-4 mb-4 border-b border-dark-600 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-brand-400 mt-2" />
                  <div>
                    <p className="font-medium">{version.change}</p>
                    <p className="text-sm text-gray-400">{version.date} • {version.author}</p>
                  </div>
                </div>
              )) || (
                <p className="text-gray-400 text-center">No history available for this rule.</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
