import { useState, useEffect } from 'react';
import { Monitor, Coffee, MessageSquare, Zap, Activity, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { teamMembers } from '../data/store';
import { useFileWatcher } from '../hooks/useFileWatcher';

const officeLayout = [
  { id: 'ceo', x: 50, y: 20, type: 'office', label: "Tee's Office" },
  { id: 'robin', x: 30, y: 40, type: 'desk', label: 'Robin' },
  { id: 'stacksmith', x: 50, y: 40, type: 'desk', label: 'StackSmith' },
  { id: 'sage', x: 70, y: 40, type: 'desk', label: 'Sage' },
  { id: 'mythos', x: 20, y: 60, type: 'desk', label: 'Mythos' },
  { id: 'pulse', x: 40, y: 60, type: 'desk', label: 'Pulse' },
  { id: 'forge', x: 60, y: 60, type: 'desk', label: 'Forge' },
  { id: 'ghost', x: 80, y: 60, type: 'desk', label: 'GhostChannel' },
  { id: 'ledger', x: 50, y: 80, type: 'desk', label: 'Ledger' },
];

const statusColors = {
  online: 'bg-green-500',
  busy: 'bg-red-500',
  idle: 'bg-yellow-500',
  offline: 'bg-gray-500',
};

export default function DigitalOffice() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [time, setTime] = useState(new Date());
  const { isConnected, refresh, files, tasks } = useFileWatcher();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getMemberById = (id: string) => teamMembers.find(m => m.id === id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Monitor className="w-8 h-8 text-brand-400" />
              Digital Office
            </h1>
            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              isConnected
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {isConnected ? (
                <><Wifi className="w-3 h-3" /> LIVE</>
              ) : (
                <><WifiOff className="w-3 h-3" /> OFFLINE</>
              )}
            </span>
          </div>
          <p className="text-gray-400 mt-1">
            Live view of team activity and workspace
            {isConnected && ` • ${files.length} files synced`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={refresh}
            disabled={!isConnected}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-gray-400 ${!isConnected ? '' : 'hover:text-brand-400'}`} />
          </button>
          <div className="glass px-4 py-2 rounded-lg">
            <span className="font-mono text-xl">{time.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Office Floor Plan */}
      <div className="card relative" style={{ height: '600px' }}>
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Office Label */}
        <div className="absolute top-4 left-4">
          <h3 className="text-lg font-bold text-gray-400">OpenClaw HQ - Floor 1</h3>
        </div>

        {/* Workstations */}
        {officeLayout.map((station) => {
          const member = getMemberById(station.id);
          if (!member && station.id !== 'ceo') return null;

          const isSelected = selectedAgent === station.id;
          const isTee = station.id === 'ceo';

          return (
            <motion.div
              key={station.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => setSelectedAgent(station.id)}
              className={`
                absolute cursor-pointer transition-all
                ${station.type === 'office' ? 'w-48 h-32' : 'w-36 h-24'}
              `}
              style={{
                left: `${station.x}%`,
                top: `${station.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Desk */}
              <div className={`
                w-full h-full rounded-lg border-2 transition-all
                ${isSelected ? 'border-brand-500 bg-brand-500/10' : 'border-dark-600 bg-dark-700'}
                ${station.type === 'office' ? 'rounded-xl' : 'rounded-lg'}
              `}>
                {/* Desk Content */}
                <div className="p-3 h-full flex flex-col">
                  {/* Status Indicator */}
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-3 h-3 rounded-full ${statusColors[member?.status || 'offline']} animate-pulse`}></div>
                    {member?.currentTask && (
                      <Activity className="w-4 h-4 text-brand-400 animate-pulse" />
                    )}
                  </div>

                  {/* Avatar & Name */}
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="text-3xl mb-1">{isTee ? '👤' : member?.avatar}</div>
                    <p className="font-bold text-sm text-center">{station.label}</p>
                    {!isTee && member && (
                      <p className="text-xs text-gray-400 text-center truncate w-full">
                        {member.workload > 0 ? `${member.workload}% workload` : 'Available'}
                      </p>
                    )}
                  </div>

                  {/* Computer Screen Effect */}
                  {member?.currentTask && (
                    <div className="mt-2 h-8 bg-dark-800 rounded border border-dark-600 overflow-hidden">
                      <div className="h-full bg-brand-500/20 animate-pulse flex items-center px-2">
                        <span className="text-xs truncate">{member.currentTask}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Connection Lines (for online agents) */}
              {member?.status === 'online' && station.id !== 'ceo' && (
                <svg 
                  className="absolute pointer-events-none"
                  style={{
                    width: '100px',
                    height: '2px',
                    left: '50%',
                    top: '-20px',
                    transform: 'translateX(-50%)',
                  }}
                >
                  <line 
                    x1="0" y1="0" x2="100" y2="0" 
                    stroke="currentColor" 
                    strokeWidth="1" 
                    className="text-brand-500/30"
                    strokeDasharray="4 4"
                  />
                </svg>
              )}
            </motion.div>
          );
        })}

        {/* Common Areas */}
        <div className="absolute right-8 top-1/4 w-24 h-24 bg-dark-700/50 rounded-full flex flex-col items-center justify-center border border-dark-600">
          <Coffee className="w-6 h-6 text-gray-400 mb-1" />
          <span className="text-xs text-gray-400">Break Room</span>
        </div>

        <div className="absolute right-8 bottom-1/4 w-24 h-24 bg-dark-700/50 rounded-full flex flex-col items-center justify-center border border-dark-600">
          <MessageSquare className="w-6 h-6 text-gray-400 mb-1" />
          <span className="text-xs text-gray-400">Meeting</span>
        </div>
      </div>

      {/* Selected Agent Details */}
      {selectedAgent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          {selectedAgent === 'ceo' ? (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-brand-600 rounded-full flex items-center justify-center text-3xl">
                👤
              </div>
              <div>
                <h3 className="text-xl font-bold">Tee</h3>
                <p className="text-gray-400">CEO & Founder</p>
                <p className="text-sm text-brand-400 mt-1">Currently working on TrackGiant</p>
              </div>
            </div>
          ) : (
            (() => {
              const member = getMemberById(selectedAgent);
              if (!member) return null;
              return (
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center text-3xl">
                    {member.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold">{member.name}</h3>
                      <span className={`badge ${
                        member.status === 'online' ? 'bg-green-500/20 text-green-400' :
                        member.status === 'busy' ? 'bg-red-500/20 text-red-400' :
                        member.status === 'idle' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {member.status}
                      </span>
                    </div>
                    <p className="text-gray-400">{member.role}</p>
                    
                    {member.currentTask ? (
                      <div className="mt-3 p-3 bg-brand-500/10 rounded-lg border border-brand-500/20">
                        <p className="text-sm text-gray-400">Current Task</p>
                        <p className="font-medium">{member.currentTask}</p>
                      </div>
                    ) : (
                      <p className="mt-3 text-gray-400">No active task - Available for assignment</p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {member.skills.map(skill => (
                        <span key={skill} className="badge bg-dark-700 text-gray-400 text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </motion.div>
      )}

      {/* Activity Feed */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Live Activity
          </h3>
          <div className="space-y-3 max-h-[200px] overflow-y-auto">
            {isConnected ? (
              tasks.length > 0 ? (
                tasks.slice(0, 10).map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-2 bg-dark-700/50 rounded-lg">
                    <span className="text-xl">
                      {task.assignee === 'tee' ? '👤' : 
                       task.assignee === 'robin' ? '🤖' : '👥'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{task.title}</p>
                      <p className="text-xs text-gray-400 truncate">{task.status} • {task.priority}</p>
                    </div>
                    <Activity className={`w-4 h-4 ${task.status === 'in-progress' ? 'text-green-400 animate-pulse' : 'text-gray-500'}`} />
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No tasks from memory files</p>
              )
            ) : (
              <p className="text-gray-400 text-center py-4">
                <WifiOff className="w-5 h-5 mx-auto mb-2" />
                Connect to see live tasks
              </p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-brand-400" />
            System Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-dark-700/50 rounded-lg">
              <span className="text-sm">WebSocket Backend</span>
              <span className={`badge ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-dark-700/50 rounded-lg">
              <span className="text-sm">Memory Files</span>
              <span className="badge bg-blue-500/20 text-blue-400">{files.length} files</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-dark-700/50 rounded-lg">
              <span className="text-sm">Active Tasks</span>
              <span className="badge bg-purple-500/20 text-purple-400">{tasks.length} tasks</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-dark-700/50 rounded-lg">
              <span className="text-sm">Netlify Hosting</span>
              <span className="badge bg-green-500/20 text-green-400">Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}