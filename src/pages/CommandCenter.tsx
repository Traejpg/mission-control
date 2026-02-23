import { useState, useRef, useEffect } from 'react';
import { 
  Terminal, 
  Send, 
  RotateCcw, 
  Trash2, 
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { commands, logs } from '../data/store';
import type { Command, LogEntry } from '../types';

export default function CommandCenter() {
  const [commandInput, setCommandInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<Command[]>(commands);
  const [logHistory, setLogHistory] = useState<LogEntry[]>(logs);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showLogs, setShowLogs] = useState(true);
  const [showHistory, setShowHistory] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logHistory]);

  const executeCommand = async () => {
    if (!commandInput.trim() || isExecuting) return;

    const newCommand: Command = {
      id: `cmd-${Date.now()}`,
      command: commandInput,
      status: 'running',
      timestamp: new Date(),
    };

    setCommandHistory(prev => [newCommand, ...prev]);
    setIsExecuting(true);
    setCommandInput('');

    // Add log entry
    const startLog: LogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date(),
      level: 'info',
      message: `Executing: ${commandInput}`,
      source: 'command-center',
    };
    setLogHistory(prev => [...prev, startLog]);

    // Simulate command execution
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success rate for demo
      
      setCommandHistory(prev => 
        prev.map(cmd => 
          cmd.id === newCommand.id 
            ? { ...cmd, status: success ? 'completed' : 'failed', duration: 2.5 }
            : cmd
        )
      );

      const resultLog: LogEntry = {
        id: `log-${Date.now() + 1}`,
        timestamp: new Date(),
        level: success ? 'success' : 'error',
        message: success ? `Completed: ${commandInput}` : `Failed: ${commandInput}`,
        source: 'command-center',
        metadata: { duration: '2.5s' },
      };
      setLogHistory(prev => [...prev, resultLog]);
      setIsExecuting(false);
    }, 2500);
  };

  const clearHistory = () => {
    setCommandHistory([]);
    setLogHistory([]);
  };

  const getStatusIcon = (status: Command['status']) => {
    switch (status) {
      case 'queued':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'info':
        return <span className="w-2 h-2 bg-blue-400 rounded-full" />;
      case 'success':
        return <span className="w-2 h-2 bg-green-400 rounded-full" />;
      case 'warn':
        return <span className="w-2 h-2 bg-yellow-400 rounded-full" />;
      case 'error':
        return <span className="w-2 h-2 bg-red-400 rounded-full" />;
      default:
        return null;
    }
  };

  const quickCommands = [
    { label: 'Deploy to Netlify', cmd: 'deploy mission-control to netlify' },
    { label: 'Check Emails', cmd: 'check email replies at scaleauto@agentmail.to' },
    { label: 'Generate Report', cmd: 'generate daily status report' },
    { label: 'Backup Memories', cmd: 'backup all memory files' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Terminal className="w-8 h-8 text-brand-400" />
            Command Center
          </h1>
          <p className="text-gray-400 mt-1">Execute commands, monitor tasks, view logs</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={clearHistory}
            className="btn-secondary flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Logs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Command Interface */}
        <div className="col-span-2 space-y-4">
          {/* Command Input */}
          <div className="card">
            <h3 className="font-bold mb-4">Execute Command</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && executeCommand()}
                    placeholder="Enter command... (e.g., 'deploy mission-control to netlify')"
                    className="w-full input pl-10 font-mono"
                    disabled={isExecuting}
                  />
                </div>
                <button
                  onClick={executeCommand}
                  disabled={isExecuting || !commandInput.trim()}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {isExecuting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  {isExecuting ? 'Running...' : 'Execute'}
                </button>
              </div>

              {/* Quick Commands */}
              <div>
                <p className="text-sm text-gray-400 mb-2">Quick Commands:</p>
                <div className="flex flex-wrap gap-2">
                  {quickCommands.map((qc) => (
                    <button
                      key={qc.label}
                      onClick={() => setCommandInput(qc.cmd)}
                      className="px-3 py-1.5 bg-dark-700 hover:bg-dark-600 rounded-lg text-sm transition-colors"
                    >
                      {qc.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Live Logs */}
          <div className="card">
            <div 
              className="flex items-center justify-between mb-4 cursor-pointer"
              onClick={() => setShowLogs(!showLogs)}
            >
              <h3 className="font-bold flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-green-400" />
                Live Logs
                <span className="badge bg-dark-700 text-gray-400 text-xs">
                  {logHistory.length}
                </span>
              </h3>
              {showLogs ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
            
            <AnimatePresence>
              {showLogs && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-dark-900 rounded-lg p-4 font-mono text-sm h-64 overflow-y-auto border border-dark-600">
                    {logHistory.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No logs yet. Execute a command to see output.</p>
                    ) : (
                      <div className="space-y-2">
                        {logHistory.map((log) => (
                          <div key={log.id} className="flex items-start gap-3">
                            <span className="mt-1.5">{getLogIcon(log.level)}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{log.timestamp.toLocaleTimeString()}</span>
                                <span>•</span>
                                <span>{log.source}</span>
                              </div>
                              <p className={`${
                                log.level === 'error' ? 'text-red-400' :
                                log.level === 'success' ? 'text-green-400' :
                                log.level === 'warn' ? 'text-yellow-400' :
                                'text-gray-300'
                              }`}>
                                {log.message}
                              </p>
                              {log.metadata && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {JSON.stringify(log.metadata)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                        <div ref={logsEndRef} />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Command Queue */}
          <div className="card">
            <div 
              className="flex items-center justify-between mb-4 cursor-pointer"
              onClick={() => setShowHistory(!showHistory)}
            >
              <h3 className="font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Command History
                <span className="badge bg-dark-700 text-gray-400 text-xs">
                  {commandHistory.length}
                </span>
              </h3>
              {showHistory ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>

            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {commandHistory.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-4">No commands executed yet.</p>
                    ) : (
                      commandHistory.map((cmd) => (
                        <div 
                          key={cmd.id}
                          className="p-3 bg-dark-700/50 rounded-lg border border-dark-600"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(cmd.status)}
                              <span className="font-mono text-sm truncate max-w-[180px]">
                                {cmd.command}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                            <span>{cmd.timestamp.toLocaleTimeString()}</span>
                            {cmd.duration && (
                              <span>{cmd.duration}s</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* System Status */}
          <div className="card">
            <h3 className="font-bold mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">OpenClaw Gateway</span>
                <span className="badge bg-green-500/20 text-green-400 text-xs">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Task Queue</span>
                <span className="badge bg-blue-500/20 text-blue-400 text-xs">{commandHistory.filter(c => c.status === 'queued').length} pending</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Active Tasks</span>
                <span className="badge bg-yellow-500/20 text-yellow-400 text-xs">{commandHistory.filter(c => c.status === 'running').length} running</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Completed Today</span>
                <span className="badge bg-green-500/20 text-green-400 text-xs">{commandHistory.filter(c => c.status === 'completed').length} done</span>
              </div>
            </div>
          </div>

          {/* API Status */}
          <div className="card">
            <h3 className="font-bold mb-4">API Status</h3>
            <div className="space-y-2">
              {['ElevenLabs', 'Twilio', 'Netlify', 'Notion', 'AgentMail'].map((api) => (
                <div key={api} className="flex items-center justify-between py-1">
                  <span className="text-sm">{api}</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-xs text-gray-400">Connected</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}