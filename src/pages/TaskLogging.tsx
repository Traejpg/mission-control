import { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Save, 
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink,
  Plus,
  Trash2,
  Calendar,
  ChevronRight,
  Copy,
  CheckSquare
} from 'lucide-react';
import { motion } from 'framer-motion';

interface LoggedTask {
  id: string;
  content: string;
  timestamp: Date;
  source: string;
  owner: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  logged: boolean;
}

// Mock recently logged tasks
const RECENT_TASKS: LoggedTask[] = [
  {
    id: 'log-1',
    content: 'Build Mission Control Content Pipeline',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    source: 'User Request',
    owner: 'StackSmith',
    priority: 'high',
    logged: true,
  },
  {
    id: 'log-2',
    content: 'Print 250 brochures for Huntington Park walk-ins',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    source: 'Daily Tasks',
    owner: 'Tee',
    priority: 'critical',
    logged: true,
  },
  {
    id: 'log-3',
    content: 'Create 5 artist accounts for TrackGiant marketplace',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    source: 'Active Tasks',
    owner: 'Robin',
    priority: 'high',
    logged: true,
  },
  {
    id: 'log-4',
    content: 'Add 4 more curators for app screenshots',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
    source: 'MEMORY.md',
    owner: 'Tee',
    priority: 'high',
    logged: true,
  },
];

// Mock memory files
const MEMORY_FILES = [
  { date: '2026-02-21', filename: '2026-02-21.md', entries: 12 },
  { date: '2026-02-20', filename: '2026-02-20.md', entries: 8 },
  { date: '2026-02-19', filename: '2026-02-19.md', entries: 15 },
  { date: '2026-02-18', filename: '2026-02-18.md', entries: 6 },
];

export default function TaskLogging() {
  const [tasks, setTasks] = useState<LoggedTask[]>(RECENT_TASKS);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskOwner, setNewTaskOwner] = useState('Tee');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [showAddForm, setShowAddForm] = useState(false);

  const addTask = () => {
    if (!newTaskContent.trim()) return;

    const task: LoggedTask = {
      id: `log-${Date.now()}`,
      content: newTaskContent,
      timestamp: new Date(),
      source: 'Manual Entry',
      owner: newTaskOwner,
      priority: newTaskPriority,
      logged: true,
    };

    setTasks(prev => [task, ...prev]);
    setNewTaskContent('');
    setShowAddForm(false);
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.logged).length;
  const criticalTasks = tasks.filter(t => t.priority === 'critical').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Task Auto-Logging</h1>
            <p className="text-gray-400">Track and manage logged tasks</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Quick Log Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <p className="text-3xl font-bold">{totalTasks}</p>
          <p className="text-sm text-gray-400">Total Logged</p>
        </div>
        <div className="card bg-green-500/10 border-green-500/30">
          <p className="text-3xl font-bold text-green-400">{completedTasks}</p>
          <p className="text-sm text-gray-400">Tracked</p>
        </div>
        <div className="card bg-red-500/10 border-red-500/30">
          <p className="text-3xl font-bold text-red-400">{criticalTasks}</p>
          <p className="text-sm text-gray-400">Critical</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Recently Logged Tasks */}
        <div className="col-span-2 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-brand-400" />
              Recently Logged Tasks
            </h2>
            
            <div className="space-y-3">
              {tasks.map(task => (
                <div 
                  key={task.id}
                  className="p-4 bg-dark-700/50 rounded-lg border border-dark-600 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">{task.content}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {task.owner}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.timestamp.toLocaleTimeString()}
                          </span>
                          <span className={`badge text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Logging Protocol Reminder */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card border-l-4 border-l-red-500 bg-red-500/10"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-red-400">Auto-Logging Protocol</h3>
                <p className="text-sm text-gray-300 mt-1">
                  CRITICAL: Any task list, project outline, or overnight work assignment MUST be:
                </p>
                <ol className="mt-2 space-y-1 text-sm text-gray-300 list-decimal list-inside">
                  <li>Immediately saved to <code className="bg-dark-700 px-1 rounded">memory/YYYY-MM-DD.md</code> with timestamp</li>
                  <li>Logged to MEMORY.md under Important Decisions if multi-day/project scope</li>
                  <li>Confirmed back to user with summary of what's being tracked</li>
                  <li>Converted to actionable items with clear ownership (who's doing what)</li>
                </ol>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Memory Files Sidebar */}
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-brand-400" />
              Memory Files
            </h2>
            
            <div className="space-y-2">
              {MEMORY_FILES.map(file => (
                <a
                  key={file.filename}
                  href={`/memory/${file.filename}`}
                  className="flex items-center justify-between p-3 bg-dark-700/50 rounded-lg border border-dark-600 hover:border-brand-500/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{file.date}</p>
                      <p className="text-xs text-gray-400">{file.entries} entries</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h3 className="font-bold mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-3 bg-dark-700/50 rounded-lg hover:bg-dark-600 transition-colors text-left">
                <Copy className="w-5 h-5 text-brand-400" />
                <span>Copy today's log</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-dark-700/50 rounded-lg hover:bg-dark-600 transition-colors text-left">
                <CheckSquare className="w-5 h-5 text-green-400" />
                <span>Mark all as reviewed</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-dark-700/50 rounded-lg hover:bg-dark-600 transition-colors text-left">
                <Save className="w-5 h-5 text-yellow-400" />
                <span>Backup to MEMORY.md</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddForm(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-dark-800 rounded-2xl border border-dark-600 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-dark-600">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-400" />
                Quick Log Task
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Task Description</label>
                <textarea
                  value={newTaskContent}
                  onChange={(e) => setNewTaskContent(e.target.value)}
                  placeholder="What needs to be tracked?"
                  className="w-full input h-24 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Owner</label>
                  <select
                    value={newTaskOwner}
                    onChange={(e) => setNewTaskOwner(e.target.value)}
                    className="w-full input"
                  >
                    <option value="Tee">Tee (You)</option>
                    <option value="Robin">Robin (AI)</option>
                    <option value="StackSmith">StackSmith</option>
                    <option value="Sage">Sage</option>
                    <option value="Mythos">Mythos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full input"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-dark-600 flex justify-end gap-3">
              <button 
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={addTask}
                disabled={!newTaskContent.trim()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Log Task
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
