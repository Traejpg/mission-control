import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Play, 
  Pause,
  RotateCcw,
  History,
  ArrowRight,
  AlertCircle,
  X,
  User,
  Calendar,
  FileText,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { teamMembers } from '../data/store';

// Delegation task statuses
type DelegationStatus = 'pending' | 'approved' | 'running' | 'completed' | 'failed';

interface DelegationTask {
  id: string;
  title: string;
  description: string;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  status: DelegationStatus;
  eta: string;
  createdAt: Date;
  approvedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  progress: number;
  output?: string;
  chunks: { id: string; description: string; status: 'pending' | 'running' | 'completed' | 'failed' }[];
}

// Initial mock data
const INITIAL_TASKS: DelegationTask[] = [
  {
    id: 'del-1',
    title: 'Research LA Restaurant Market',
    description: 'Analyze competition and pricing for AI voice agent sales in Huntington Park area',
    agentId: 'sage',
    agentName: 'Sage',
    agentEmoji: '🔍',
    status: 'running',
    eta: '90 min',
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    approvedAt: new Date(Date.now() - 1000 * 60 * 25),
    startedAt: new Date(Date.now() - 1000 * 60 * 20),
    progress: 45,
    chunks: [
      { id: 'c1', description: 'Identify top 20 restaurants', status: 'completed' },
      { id: 'c2', description: 'Analyze competitor pricing', status: 'running' },
      { id: 'c3', description: 'Compile report', status: 'pending' },
    ],
  },
  {
    id: 'del-2',
    title: 'Write Email Sequence',
    description: '3-part cold email sequence for auto repair shop outreach',
    agentId: 'mythos',
    agentName: 'Mythos',
    agentEmoji: '📜',
    status: 'completed',
    eta: '30 min',
    createdAt: new Date(Date.now() - 1000 * 60 * 60),
    approvedAt: new Date(Date.now() - 1000 * 60 * 55),
    startedAt: new Date(Date.now() - 1000 * 60 * 50),
    completedAt: new Date(),
    progress: 100,
    output: '/outputs/auto-repair-emails.md',
    chunks: [
      { id: 'c1', description: 'Write email 1', status: 'completed' },
      { id: 'c2', description: 'Write email 2', status: 'completed' },
      { id: 'c3', description: 'Write email 3', status: 'completed' },
    ],
  },
  {
    id: 'del-3',
    title: 'Design Social Media Graphics',
    description: 'Create 5 Instagram posts for TrackGiant launch campaign',
    agentId: 'pulse',
    agentName: 'Pulse',
    agentEmoji: '📱',
    status: 'pending',
    eta: '60 min',
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
    progress: 0,
    chunks: [
      { id: 'c1', description: 'Design post 1-2', status: 'pending' },
      { id: 'c2', description: 'Design post 3-4', status: 'pending' },
      { id: 'c3', description: 'Design post 5 + captions', status: 'pending' },
    ],
  },
];

export default function DelegationWorkflow() {
  const [tasks, setTasks] = useState<DelegationTask[]>(INITIAL_TASKS);
  const [showProposeForm, setShowProposeForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<DelegationTask | null>(null);
  
  // New task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    agentId: 'sage',
    eta: '30',
  });

  // Simulate progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prev => prev.map(task => {
        if (task.status === 'running' && task.progress < 100) {
          return { ...task, progress: Math.min(task.progress + Math.random() * 3, 100) };
        }
        return task;
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const proposeTask = () => {
    const agent = teamMembers.find(m => m.id === newTask.agentId);
    if (!agent) return;

    const task: DelegationTask = {
      id: `del-${Date.now()}`,
      title: newTask.title,
      description: newTask.description,
      agentId: agent.id,
      agentName: agent.name,
      agentEmoji: agent.avatar,
      status: 'pending',
      eta: `${newTask.eta} min`,
      createdAt: new Date(),
      progress: 0,
      chunks: [
        { id: 'c1', description: 'Initial research', status: 'pending' },
        { id: 'c2', description: 'Draft content', status: 'pending' },
        { id: 'c3', description: 'Final review', status: 'pending' },
      ],
    };

    setTasks(prev => [task, ...prev]);
    setShowProposeForm(false);
    setNewTask({ title: '', description: '', agentId: 'sage', eta: '30' });
  };

  const approveTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: 'approved', approvedAt: new Date() }
        : task
    ));
    // Auto-start after approval
    setTimeout(() => {
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'running', startedAt: new Date() }
          : task
      ));
    }, 1000);
  };

  const rejectTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const approvedTasks = tasks.filter(t => t.status === 'approved');
  const runningTasks = tasks.filter(t => t.status === 'running');
  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'failed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Delegation Workflow</h1>
            <p className="text-gray-400">Propose → Approve → Execute → Complete</p>
          </div>
        </div>
        <button 
          onClick={() => setShowProposeForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Propose Task
        </button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card bg-yellow-500/10 border-yellow-500/30">
          <p className="text-3xl font-bold">{pendingTasks.length}</p>
          <p className="text-sm text-gray-400">Pending Approval</p>
        </div>
        <div className="card bg-blue-500/10 border-blue-500/30">
          <p className="text-3xl font-bold">{approvedTasks.length}</p>
          <p className="text-sm text-gray-400">Approved</p>
        </div>
        <div className="card bg-purple-500/10 border-purple-500/30">
          <p className="text-3xl font-bold">{runningTasks.length}</p>
          <p className="text-sm text-gray-400">Running</p>
        </div>
        <div className="card bg-green-500/10 border-green-500/30">
          <p className="text-3xl font-bold">{completedTasks.length}</p>
          <p className="text-sm text-gray-400">Completed</p>
        </div>
      </div>

      {/* Pending Approval Section */}
      {pendingTasks.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card border-l-4 border-l-yellow-500"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-yellow-400" />
            Pending Your Approval
          </h2>
          <div className="space-y-3">
            {pendingTasks.map(task => (
              <div key={task.id} className="p-4 bg-dark-700/50 rounded-lg border border-dark-600">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{task.agentEmoji}</span>
                    <div>
                      <h3 className="font-bold">{task.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {task.agentName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          ETA: {task.eta}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => rejectTask(task.id)}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => approveTask(task.id)}
                      className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Running Tasks */}
      {runningTasks.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card border-l-4 border-l-purple-500"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-purple-400 animate-spin" />
            Currently Running
          </h2>
          <div className="space-y-3">
            {runningTasks.map(task => (
              <div 
                key={task.id} 
                onClick={() => setSelectedTask(task)}
                className="p-4 bg-dark-700/50 rounded-lg border border-dark-600 cursor-pointer hover:border-purple-500/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{task.agentEmoji}</span>
                    <div className="flex-1">
                      <h3 className="font-bold">{task.title}</h3>
                      <p className="text-sm text-gray-400">{task.agentName} • Started {task.startedAt?.toLocaleTimeString()}</p>
                      
                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{Math.round(task.progress)}%</span>
                        </div>
                        <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 rounded-full transition-all"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Chunk Indicators */}
                      <div className="flex gap-1 mt-2">
                        {task.chunks.map((chunk, idx) => (
                          <div 
                            key={chunk.id}
                            className={`flex-1 h-1.5 rounded-full ${
                              chunk.status === 'completed' ? 'bg-green-500' :
                              chunk.status === 'running' ? 'bg-purple-500' :
                              'bg-dark-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <Play className="w-5 h-5 text-purple-400" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <History className="w-6 h-6 text-green-400" />
            Completed History
          </h2>
          <div className="space-y-2">
            {completedTasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-dark-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{task.agentEmoji}</span>
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-gray-400">{task.agentName} • {task.completedAt?.toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {task.output && (
                    <a 
                      href={task.output}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 text-brand-400 hover:bg-brand-500/10 rounded-lg"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Propose Task Modal */}
      <AnimatePresence>
        {showProposeForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowProposeForm(false)}
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
                  Propose New Task
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Task Title</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="What needs to be done?"
                    className="w-full input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Description</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description of the task..."
                    className="w-full input h-24 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Assign to Agent</label>
                    <select
                      value={newTask.agentId}
                      onChange={(e) => setNewTask(prev => ({ ...prev, agentId: e.target.value }))}
                      className="w-full input"
                    >
                      {teamMembers.filter(m => m.id !== 'robin').map(agent => (
                        <option key={agent.id} value={agent.id}>
                          {agent.avatar} {agent.name} — {agent.role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">ETA (minutes)</label>
                    <input
                      type="number"
                      value={newTask.eta}
                      onChange={(e) => setNewTask(prev => ({ ...prev, eta: e.target.value }))}
                      className="w-full input"
                      min="5"
                      max="480"
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-dark-600 flex justify-end gap-3">
                <button 
                  onClick={() => setShowProposeForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={proposeTask}
                  disabled={!newTask.title || !newTask.description}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  <ArrowRight className="w-4 h-4" />
                  Propose Task
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedTask(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-dark-800 rounded-2xl border border-dark-600 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-dark-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedTask.agentEmoji}</span>
                    <div>
                      <h3 className="text-xl font-bold">{selectedTask.title}</h3>
                      <p className="text-sm text-gray-400">{selectedTask.agentName} • {selectedTask.status}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedTask(null)}>
                    <X className="w-6 h-6 text-gray-400 hover:text-white" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-gray-300">{selectedTask.description}</p>
                </div>

                {selectedTask.status === 'running' && (
                  <div>
                    <h4 className="font-medium mb-2">Progress</h4>
                    <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${selectedTask.progress}%` }}
                      />
                    </div>
                    <p className="text-right text-sm text-gray-400 mt-1">{Math.round(selectedTask.progress)}%</p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-3">Task Chunks</h4>
                  <div className="space-y-2">
                    {selectedTask.chunks.map((chunk, idx) => (
                      <div 
                        key={chunk.id}
                        className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-lg"
                      >
                        {chunk.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : chunk.status === 'running' ? (
                          <RotateCcw className="w-5 h-5 text-purple-400 animate-spin" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-500" />
                        )}
                        <span className={chunk.status === 'completed' ? 'text-green-400' : ''}>
                          {chunk.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedTask.output && (
                  <div>
                    <h4 className="font-medium mb-2">Output</h4>
                    <a 
                      href={selectedTask.output}
                      className="flex items-center gap-2 p-3 bg-brand-500/10 border border-brand-500/30 rounded-lg text-brand-400"
                    >
                      <FileText className="w-4 h-4" />
                      {selectedTask.output}
                      <ExternalLink className="w-4 h-4 ml-auto" />
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
