// File Watcher Client Hook
// Connects to File Watcher Backend for real-time two-way sync

import { useState, useEffect, useCallback } from 'react';
import type { Task, Memory } from '../types';

interface FileData {
  id: string;
  date: string;
  content: string;
  lastModified: number;
  tasks: Task[];
  memories: Memory[];
}

interface FileWatcherState {
  files: FileData[];
  tasks: Task[];
  memories: Memory[];
  isConnected: boolean;
  isWriting: boolean;
  lastUpdate: number;
  selectedFile: string | null;
}

// Use environment variable for cloud deployment, fallback to localhost for local dev
const WATCHER_URL = import.meta.env.VITE_WATCHER_URL || 'wss://mission-control-v954.onrender.com/ws';

console.log('[FileWatcher] Connecting to:', WATCHER_URL);

export function useFileWatcher(): FileWatcherState & {
  refresh: () => void;
  writeFile: (date: string, content: string) => Promise<boolean>;
  createFile: (date: string, template?: string) => Promise<boolean>;
  selectFile: (date: string) => void;
} {
  const [state, setState] = useState<FileWatcherState>({
    files: [],
    tasks: [],
    memories: [],
    isConnected: false,
    isWriting: false,
    lastUpdate: 0,
    selectedFile: null
  });

  const [ws, setWs] = useState<WebSocket | null>(null);

  // Connect to file watcher
  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout;
    
    const connect = () => {
      console.log('[FileWatcher] Attempting connection...');
      const socket = new WebSocket(WATCHER_URL);
      
      socket.onopen = () => {
        console.log('[FileWatcher] Connected successfully');
        setState(prev => ({ ...prev, isConnected: true }));
        
        // Subscribe to channels
        socket.send(JSON.stringify({
          type: 'subscribe',
          channels: ['files', 'tasks', 'memories']
        }));
      };
      
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[FileWatcher] Received:', message.type);
          handleMessage(message);
        } catch (error) {
          console.error('[FileWatcher] Parse error:', error);
        }
      };
      
      socket.onclose = (event) => {
        console.log('[FileWatcher] Disconnected. Code:', event.code, 'Reason:', event.reason);
        setState(prev => ({ ...prev, isConnected: false }));
        // Auto-reconnect after 3 seconds
        reconnectTimer = setTimeout(connect, 3000);
      };
      
      socket.onerror = (error) => {
        console.error('[FileWatcher] WebSocket error:', error);
      };
      
      setWs(socket);
    };
    
    connect();
    
    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  // Handle incoming messages
  const handleMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'files':
        const files = message.payload.files || [];
        // Extract tasks from all files
        const allTasks = files.flatMap((f: any) => f.tasks || []);
        setState(prev => ({
          ...prev,
          files: files,
          tasks: allTasks,
          lastUpdate: Date.now()
        }));
        console.log('[FileWatcher] Files received:', files.length, 'Tasks extracted:', allTasks.length);
        break;
        
      case 'memories':
        setState(prev => ({
          ...prev,
          memories: message.payload.memories || [],
          lastUpdate: Date.now()
        }));
        console.log('[FileWatcher] Memories received:', (message.payload.memories || []).length);
        break;
        
      case 'file_add':
      case 'file_change':
        setState(prev => {
          const newFile = message.payload.file;
          const files = prev.files.filter(f => f.date !== newFile.date);
          return {
            ...prev,
            files: [newFile, ...files].sort((a, b) => b.date.localeCompare(a.date)),
            tasks: [...files, newFile].flatMap(f => f.tasks),
            memories: [...files, newFile].flatMap(f => f.memories),
            lastUpdate: Date.now()
          };
        });
        break;
        
      case 'file_delete':
        setState(prev => ({
          ...prev,
          files: prev.files.filter(f => f.date !== message.payload.date),
          lastUpdate: Date.now()
        }));
        break;
        
      case 'write_complete':
        setState(prev => ({ ...prev, isWriting: false }));
        break;
    }
  }, []);

  // Refresh data
  const refresh = useCallback(() => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'request', resource: 'files' }));
    }
  }, [ws]);

  // Write file (two-way sync)
  const writeFile = useCallback(async (date: string, content: string): Promise<boolean> => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('[FileWatcher] Not connected');
      return false;
    }
    
    setState(prev => ({ ...prev, isWriting: true }));
    
    ws.send(JSON.stringify({
      type: 'write_file',
      date,
      content
    }));
    
    return true;
  }, [ws]);

  // Create new file
  const createFile = useCallback(async (date: string, template?: string): Promise<boolean> => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('[FileWatcher] Not connected');
      return false;
    }
    
    ws.send(JSON.stringify({
      type: 'create_file',
      date,
      template
    }));
    
    return true;
  }, [ws]);

  // Select file for editing
  const selectFile = useCallback((date: string) => {
    setState(prev => ({ ...prev, selectedFile: date }));
  }, []);

  return {
    ...state,
    refresh,
    writeFile,
    createFile,
    selectFile
  };
}
