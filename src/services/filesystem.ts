// File System Service - Watches memory files and reads live data
// In production, this would connect to a backend file watcher
// For now, we'll use localStorage sync and periodic refreshes

import { Memory, Task, CalendarEvent } from '../types';

export interface MemoryFile {
  date: string;
  content: string;
  lastModified: number;
}

class FileSystemService {
  private memoryCache: Map<string, MemoryFile> = new Map();
  private watchers: Set<(files: MemoryFile[]) => void> = new Set();
  private intervalId: ReturnType<typeof setInterval> | null = null;

  // Start watching for changes (polls every 30 seconds)
  startWatching(intervalMs: number = 30000) {
    if (this.intervalId) return;
    
    this.intervalId = setInterval(() => {
      this.scanMemoryFiles();
    }, intervalMs);
    
    // Initial scan
    this.scanMemoryFiles();
  }

  // Stop watching
  stopWatching() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Register a callback for file changes
  onChange(callback: (files: MemoryFile[]) => void) {
    this.watchers.add(callback);
    return () => this.watchers.delete(callback);
  }

  // Scan memory files (simulated - in real impl, would read from backend)
  private async scanMemoryFiles() {
    // In a real implementation, this would:
    // 1. Call backend API to list memory/ directory
    // 2. Compare timestamps with cache
    // 3. Fetch new/changed files
    // 4. Notify watchers
    
    // For now, we'll check localStorage for updates from other tabs/sessions
    const memoryData = localStorage.getItem('mc-memory-files');
    if (memoryData) {
      const files: MemoryFile[] = JSON.parse(memoryData);
      let hasChanges = false;
      
      for (const file of files) {
        const cached = this.memoryCache.get(file.date);
        if (!cached || cached.lastModified !== file.lastModified) {
          this.memoryCache.set(file.date, file);
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        this.notifyWatchers();
      }
    }
  }

  // Parse memories from markdown content
  parseMemories(content: string, source: string): Memory[] {
    const memories: Memory[] = [];
    const lines = content.split('\n');
    let currentMemory: Partial<Memory> | null = null;
    let memoryContent: string[] = [];

    for (const line of lines) {
      // New memory header (## or ###)
      if (line.match(/^#{2,3}\s+/)) {
        if (currentMemory && currentMemory.title) {
          memories.push({
            ...currentMemory as Memory,
            content: memoryContent.join('\n').trim(),
          });
        }
        currentMemory = {
          id: `mem-${Date.now()}-${memories.length}`,
          title: line.replace(/^#{2,3}\s+/, ''),
          category: 'general',
          date: new Date(),
          tags: [],
          source,
        };
        memoryContent = [];
      } else if (currentMemory) {
        // Parse tags
        if (line.includes('Tags:')) {
          const tagMatch = line.match(/Tags:\s*(.+)/i);
          if (tagMatch) {
            currentMemory.tags = tagMatch[1].split(',').map(t => t.trim());
          }
        }
        // Parse category
        else if (line.includes('Category:')) {
          const catMatch = line.match(/Category:\s*(.+)/i);
          if (catMatch) {
            currentMemory.category = catMatch[1].trim();
          }
        }
        // Collect content
        else if (!line.startsWith('---') && !line.startsWith('**')) {
          memoryContent.push(line);
        }
      }
    }

    // Don't forget the last memory
    if (currentMemory && currentMemory.title) {
      memories.push({
        ...currentMemory as Memory,
        content: memoryContent.join('\n').trim(),
      });
    }

    return memories;
  }

  // Parse tasks from markdown
  parseTasks(content: string, workflow: string): Partial<Task>[] {
    const tasks: Partial<Task>[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      // Check for task patterns
      const taskMatch = line.match(/^- \[([ x])\]\s*(.+)/);
      if (taskMatch) {
        const isDone = taskMatch[1] === 'x';
        const title = taskMatch[2].replace(/\*\*/g, '').trim();
        
        tasks.push({
          title,
          status: isDone ? 'done' : 'todo',
          workflow: workflow as any,
          priority: 'medium',
          description: '',
          tags: [],
        });
      }
    }

    return tasks;
  }

  // Save memory file (broadcasts to other tabs)
  saveMemoryFile(date: string, content: string) {
    const file: MemoryFile = {
      date,
      content,
      lastModified: Date.now(),
    };
    
    this.memoryCache.set(date, file);
    
    // Broadcast to localStorage for other tabs
    const allFiles = Array.from(this.memoryCache.values());
    localStorage.setItem('mc-memory-files', JSON.stringify(allFiles));
    
    this.notifyWatchers();
  }

  // Get all cached memory files
  getMemoryFiles(): MemoryFile[] {
    return Array.from(this.memoryCache.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  // Get specific file content
  getFileContent(date: string): string | null {
    return this.memoryCache.get(date)?.content || null;
  }

  private notifyWatchers() {
    const files = this.getMemoryFiles();
    this.watchers.forEach(cb => cb(files));
  }
}

export const fileSystemService = new FileSystemService();
