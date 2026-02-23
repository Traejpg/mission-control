// Live Data Hook - Combines Gateway, File System, and Polling for real-time updates

import { useState, useEffect, useCallback, useRef } from 'react';
import { gatewayService, LiveSession } from '../services/gateway';
import { fileSystemService } from '../services/filesystem';
import type { MemoryFile } from '../services/filesystem';
import { Memory, TeamMember, Task, LogEntry } from '../types';

interface LiveDataState {
  // Sessions
  sessions: LiveSession[];
  isLoading: boolean;
  lastUpdate: number;
  gatewayConnected: boolean;
  
  // Derived data
  activeAgents: string[];
  recentMemories: Memory[];
  systemLogs: LogEntry[];
}

interface LiveDataActions {
  refresh: () => Promise<void>;
  startPolling: (intervalMs?: number) => void;
  stopPolling: () => void;
}

export function useLiveData(): LiveDataState & LiveDataActions {
  const [state, setState] = useState<LiveDataState>({
    sessions: [],
    isLoading: true,
    lastUpdate: 0,
    gatewayConnected: false,
    activeAgents: [],
    recentMemories: [],
    systemLogs: [],
  });

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Map sessions to active agents
  const deriveActiveAgents = useCallback((sessions: LiveSession[]): string[] => {
    const active = new Set<string>();
    
    sessions.forEach(session => {
      // Extract agent name from session key
      // Format: agent:main:subagent:uuid or agent:main:main
      const parts = session.key.split(':');
      if (parts.length >= 3) {
        if (parts[2] === 'subagent') {
          // Check session label for agent name
          if (session.label) {
            const agentName = session.label.split(':')[0]?.trim();
            if (agentName) active.add(agentName.toLowerCase());
          }
        }
      }
    });
    
    return Array.from(active);
  }, []);

  // Refresh all data sources
  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Fetch live sessions from Gateway
      const sessions = await gatewayService.getSessions();
      const gatewayStatus = await gatewayService.getStatus();
      
      // Cache sessions
      gatewayService.cacheSessions(sessions);

      // Get memory files
      const memoryFiles = fileSystemService.getMemoryFiles();
      const memories: Memory[] = [];
      
      memoryFiles.slice(0, 5).forEach((file: MemoryFile) => {
        const parsed = fileSystemService.parseMemories(file.content, file.date);
        memories.push(...parsed);
      });

      // Generate system logs from sessions
      const logs: LogEntry[] = sessions.map((s: LiveSession) => ({
        id: `log-${s.key}`,
        timestamp: new Date(s.updatedAt),
        level: 'info' as const,
        message: `Session ${s.displayName} - ${s.label || 'active'}`,
        source: s.kind,
      }));

      setState({
        sessions,
        isLoading: false,
        lastUpdate: Date.now(),
        gatewayConnected: !!gatewayStatus,
        activeAgents: deriveActiveAgents(sessions),
        recentMemories: memories.slice(0, 10),
        systemLogs: logs.slice(0, 20),
      });
    } catch (error) {
      console.error('Live data refresh failed:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [deriveActiveAgents]);

  // Start polling for updates
  const startPolling = useCallback((intervalMs: number = 10000) => {
    if (pollingRef.current) return;
    
    // Start file system watcher
    fileSystemService.startWatching(intervalMs);
    
    // Start polling
    pollingRef.current = setInterval(() => {
      refresh();
    }, intervalMs);

    // Initial refresh
    refresh();
  }, [refresh]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    fileSystemService.stopWatching();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    ...state,
    refresh,
    startPolling,
    stopPolling,
  };
}

// Hook for live team status
export function useLiveTeam(teamMembers: TeamMember[]): TeamMember[] {
  const { sessions, activeAgents } = useLiveData();
  
  return teamMembers.map(member => {
    const isActive = activeAgents.includes(member.id.toLowerCase()) ||
                     activeAgents.includes(member.name.toLowerCase());
    
    // Find related session for current task
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
}

// Hook for live task updates from memory files
export function useLiveTasks(): Task[] {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const unsubscribe = fileSystemService.onChange((files: MemoryFile[]) => {
      const allTasks: Task[] = [];
      
      files.forEach((file: MemoryFile) => {
        // Determine workflow from filename or content
        let workflow = 'personal';
        if (file.date.includes('trackgiant')) workflow = 'trackgiant';
        else if (file.date.includes('real-estate')) workflow = 'real-estate';
        else if (file.date.includes('ai') || file.date.includes('agency')) workflow = 'ai-agency';
        
        const parsed = fileSystemService.parseTasks(file.content, workflow);
        allTasks.push(...parsed.map((t: Partial<Task>, i: number) => ({
          ...t,
          id: `task-${file.date}-${i}`,
          assignee: 'robin',
          createdAt: new Date(file.date),
          updatedAt: new Date(file.lastModified),
        })) as Task[]);
      });

      setTasks(allTasks);
    });

    // Initial load - trigger a scan by starting/stopping
    fileSystemService.startWatching(30000);
    
    return () => { 
      unsubscribe(); 
      fileSystemService.stopWatching();
    };
  }, []);

  return tasks;
}
