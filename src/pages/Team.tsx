import { useEffect } from 'react';
import { Users, Plus, Settings, Mail, Activity, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { teamMembers } from '../data/store';
import { 
  useWebSocketSessions,
  useWebSocketConnection,
  webSocketService 
} from '../services/websocket';
import type { LiveSession } from '../services/gateway';

const roles = {
  'Leadership': ['robin'],
  'Development': ['stacksmith'],
  'Research & Analysis': ['sage'],
  'Content & Creative': ['mythos', 'pulse', 'ghost'],
  'Operations': ['forge', 'ledger'],
};

const statusIcons = {
  busy: '🔴',
  idle: '🟡',
};

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

export default function Team() {
  // WebSocket data
  const sessions = useWebSocketSessions();
  const { isConnected } = useWebSocketConnection();

  // Calculate live stats
  const activeAgents = deriveActiveAgents(sessions);
  const onlineCount = activeAgents.length;
  const activeTaskCount = sessions.filter(s => s.label).length;
  
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

  const avgWorkload = Math.round(
    liveTeam.reduce((acc, m) => acc + m.workload, 0) / (liveTeam.length || 1)
  );

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header with WebSocket Status - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="responsive-h1 flex items-center gap-2">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-brand-400" />
              <span className="hidden sm:inline">Team Structure</span>
              <span className="sm:hidden">Team</span>
            </h1>
            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              isConnected 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {isConnected ? (
                <><Wifi className="w-3 h-3" /> <span className="hidden sm:inline">LIVE</span></>
              ) : (
                <><WifiOff className="w-3 h-3" /> <span className="hidden sm:inline">OFFLINE</span></>
              )}
            </span>
          </div>
          <p className="text-gray-400 mt-1 text-sm">
            Subagents organized by role
            {sessions.length > 0 && (
              <span className="ml-2 text-green-400">
                • {sessions.length} active
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isConnected && (
            <button 
              onClick={() => webSocketService.connect()}
              className="btn-secondary text-sm touch-target"
            >
              Reconnect
            </button>
          )}
          <button className="btn-primary flex items-center gap-2 touch-target">
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add Agent</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Live Team Overview Stats - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="card">
          <p className="text-gray-400 text-xs lg:text-sm">Total Agents</p>
          <p className="text-2xl lg:text-3xl font-bold">{liveTeam.length}</p>
        </div>
        <div className="card border-green-500/20">
          <p className="text-gray-400 text-xs lg:text-sm flex items-center gap-1">
            Online
            {isConnected && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
          </p>
          <p className="text-2xl lg:text-3xl font-bold text-green-400">
            {onlineCount}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-400 text-xs lg:text-sm">Active Tasks</p>
          <p className="text-2xl lg:text-3xl font-bold text-brand-400">
            {activeTaskCount}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-400 text-xs lg:text-sm">Avg Workload</p>
          <p className="text-2xl lg:text-3xl font-bold text-yellow-400">
            {avgWorkload}%
          </p>
        </div>
      </div>

      {/* Live Sessions - Mobile Scrollable */}
      {sessions.length > 0 && (
        <div className="card border-brand-500/30">
          <h3 className="font-bold text-base lg:text-lg mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 lg:w-5 lg:h-5 text-brand-400" />
            Live Sessions ({sessions.length})
            {isConnected && (
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </h3>
          <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
            <div className="flex lg:grid lg:grid-cols-3 gap-3 min-w-[600px] lg:min-w-0">
              {sessions.map((session) => (
                <div 
                  key={session.key}
                  className="p-3 bg-dark-700/50 rounded-lg flex items-center gap-3 hover:bg-dark-700 transition-colors flex-shrink-0 w-[200px] lg:w-auto"
                >
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{session.displayName}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {session.label || session.kind}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Organization Chart with Live Status - Responsive */}
      <div className="space-y-6 lg:space-y-8">
        {Object.entries(roles).map(([roleName, memberIds], roleIndex) => (
          <motion.div
            key={roleName}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: roleIndex * 0.1 }}
          >
            <h3 className="text-base lg:text-lg font-bold mb-4 flex items-center gap-2">
              <div className="w-6 lg:w-8 h-0.5 bg-brand-500"></div>
              {roleName}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              {memberIds.map((id) => {
                const member = liveTeam.find(m => m.id === id);
                if (!member) return null;

                return (
                  <motion.div
                    key={member.id}
                    whileHover={{ scale: 1.02 }}
                    className={`card-hover ${member.status === 'busy' ? 'border-green-500/30' : ''}`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-dark-700 rounded-full flex items-center justify-center text-xl lg:text-2xl">
                        {member.avatar}
                      </div>
                      <div className="flex items-center gap-1">
                        <span title={member.status}>{statusIcons[member.status]}</span>
                        <button className="p-2 hover:bg-dark-700 rounded touch-target" aria-label="Settings">
                          <Settings className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <h4 className="font-bold text-sm lg:text-base">{member.name}</h4>
                    <p className="text-xs lg:text-sm text-gray-400 mb-3">{member.role}</p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {member.skills.slice(0, 2).map((skill) => (
                        <span key={skill} className="badge bg-dark-700 text-gray-400 text-xs">
                          {skill}
                        </span>
                      ))}
                      {member.skills.length > 2 && (
                        <span className="badge bg-dark-700 text-gray-400 text-xs">
                          +{member.skills.length - 2}
                        </span>
                      )}
                    </div>

                    {/* Current Task - Live from WebSocket */}
                    {member.currentTask ? (
                      <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                        <p className="text-xs text-gray-400">Current Task</p>
                        <p className="text-xs lg:text-sm font-medium truncate">{member.currentTask}</p>
                      </div>
                    ) : (
                      <div className="p-2 bg-dark-700 rounded-lg">
                        <p className="text-xs text-gray-400">No active task</p>
                      </div>
                    )}

                    {/* Live Workload Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Workload</span>
                        <span className={member.workload > 80 ? 'text-red-400' : 'text-gray-400'}>
                          {member.workload}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            member.workload > 80 ? 'bg-red-500' : 
                            member.workload > 50 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${member.workload}%` }}
                        />
                      </div>
                    </div>

                    {/* Live Last Active */}
                    <p className="text-xs text-gray-500 mt-3">
                      Last: {member.lastActive.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Live Agent Directory - Table with Horizontal Scroll on Mobile */}
      <div className="card mt-6 lg:mt-8">
        <h3 className="font-bold text-base lg:text-lg mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 lg:w-5 lg:h-5 text-brand-400" />
          Live Agent Directory
          {isConnected && (
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          )}
        </h3>
        <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="text-left py-3 px-2 lg:px-4 text-xs lg:text-sm font-medium text-gray-400">Agent</th>
                <th className="text-left py-3 px-2 lg:px-4 text-xs lg:text-sm font-medium text-gray-400">Role</th>
                <th className="text-left py-3 px-2 lg:px-4 text-xs lg:text-sm font-medium text-gray-400">Status</th>
                <th className="text-left py-3 px-2 lg:px-4 text-xs lg:text-sm font-medium text-gray-400 hidden sm:table-cell">Current Task</th>
                <th className="text-left py-3 px-2 lg:px-4 text-xs lg:text-sm font-medium text-gray-400">Workload</th>
                <th className="text-left py-3 px-2 lg:px-4 text-xs lg:text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {liveTeam.map((member) => (
                <tr key={member.id} className="border-b border-dark-600/50 hover:bg-dark-700/50">
                  <td className="py-3 px-2 lg:px-4">
                    <div className="flex items-center gap-2 lg:gap-3">
                      <span className="text-lg lg:text-xl">{member.avatar}</span>
                      <div>
                        <span className="font-medium text-sm">{member.name}</span>
                        {member.status === 'busy' && (
                          <span className="ml-2 w-2 h-2 bg-green-400 rounded-full inline-block animate-pulse" />
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 lg:px-4 text-xs lg:text-sm text-gray-400">{member.role}</td>
                  <td className="py-3 px-2 lg:px-4">
                    <span className={`badge ${
                      member.status === 'busy' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 lg:px-4 text-xs lg:text-sm max-w-[150px] truncate hidden sm:table-cell">
                    {member.currentTask || '—'}
                  </td>
                  <td className="py-3 px-2 lg:px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 lg:w-20 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            member.workload > 80 ? 'bg-red-500' : 
                            member.workload > 50 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${member.workload}%` }}
                        />
                      </div>
                      <span className="text-xs lg:text-sm">{member.workload}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 lg:px-4">
                    <button className="p-2 hover:bg-dark-700 rounded-lg transition-colors touch-target" aria-label="Message">
                      <Mail className="w-4 h-4 text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Connection Status Footer */}
      <div className={`p-3 lg:p-4 rounded-lg border ${
        isConnected 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-red-500/10 border-red-500/30'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <Wifi className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-400 text-sm">WebSocket Connected</p>
                  <p className="text-xs text-gray-400">Real-time updates active</p>
                </div>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-400 text-sm">WebSocket Disconnected</p>
                  <p className="text-xs text-gray-400">Attempting to reconnect...</p>
                </div>
              </>
            )}
          </div>
          <div className="text-left sm:text-right text-xs text-gray-500">
            <p className="hidden sm:block">{import.meta.env.VITE_GATEWAY_URL || 'ws://127.0.0.1:18789'}</p>
            <p>Sessions: {sessions.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
