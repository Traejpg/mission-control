import { useState } from 'react';
import { Plus, Filter, MoreHorizontal, Calendar, User, Tag, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { workflows } from '../data/store';
import { useFileWatcher } from '../hooks/useFileWatcher';
import type { Task, WorkflowType } from '../types';

const columns = [
  { id: 'todo', title: 'To Do', color: 'gray' },
  { id: 'in-progress', title: 'In Progress', color: 'blue' },
  { id: 'review', title: 'Review', color: 'yellow' },
  { id: 'done', title: 'Done', color: 'green' },
];

const priorityColors = {
  low: 'bg-gray-500/20 text-gray-400',
  medium: 'bg-blue-500/20 text-blue-400',
  high: 'bg-orange-500/20 text-orange-400',
  critical: 'bg-red-500/20 text-red-400',
};

export default function TaskBoard() {
  const { tasks, isConnected, refresh } = useFileWatcher();
  const [filterWorkflow, setFilterWorkflow] = useState<WorkflowType | 'all'>('all');
  const [filterAssignee, setFilterAssignee] = useState<'all' | 'tee' | 'robin'>('all');

  const filteredTasks = tasks.filter(task => {
    if (filterWorkflow !== 'all' && task.workflow !== filterWorkflow) return false;
    if (filterAssignee !== 'all' && task.assignee !== filterAssignee) return false;
    return true;
  });

  const getTasksByStatus = (status: Task['status']) => 
    filteredTasks.filter(task => task.status === status);

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="responsive-h1">Task Board</h1>
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
            {tasks.length} tasks from memory files
            {!isConnected && <span className="hidden sm:inline"> • Connect to file watcher to sync</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={!isConnected}
            className="p-2.5 hover:bg-dark-700 rounded-lg transition-colors disabled:opacity-50 touch-target"
            aria-label="Refresh tasks"
          >
            <RefreshCw className={`w-5 h-5 text-gray-400 ${!isConnected ? '' : 'hover:text-brand-400'}`} />
          </button>
          <button className="btn-primary flex items-center gap-2 touch-target">
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New Task</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Filters - Mobile Scrollable */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">Filter:</span>
        </div>
        <select 
          value={filterWorkflow}
          onChange={(e) => setFilterWorkflow(e.target.value as WorkflowType | 'all')}
          className="input text-sm py-2 flex-shrink-0 min-w-[140px]"
        >
          <option value="all">All Workflows</option>
          {workflows.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <select 
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value as 'all' | 'tee' | 'robin')}
          className="input text-sm py-2 flex-shrink-0 min-w-[120px]"
        >
          <option value="all">All</option>
          <option value="tee">Tee (You)</option>
          <option value="robin">Robin (AI)</option>
        </select>
      </div>

      {/* Kanban Board - Responsive */}
      <div className="overflow-x-auto -mx-4 px-4 pb-4 lg:mx-0 lg:px-0 scrollbar-hide">
        <div className="flex lg:grid lg:grid-cols-4 gap-4 min-w-[1000px] lg:min-w-0">
          {columns.map((column) => {
            const columnTasks = getTasksByStatus(column.id as Task['status']);
            return (
              <div key={column.id} className="flex flex-col w-[280px] lg:w-auto flex-shrink-0">
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm lg:text-base">{column.title}</h3>
                    <span className="badge bg-dark-700 text-gray-400">
                      {columnTasks.length}
                    </span>
                  </div>
                  <button className="p-2 hover:bg-dark-700 rounded touch-target" aria-label="Add task">
                    <Plus className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                {/* Tasks */}
                <div className="space-y-3">
                  {columnTasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="card-hover cursor-pointer group"
                    >
                      {/* Priority Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`badge text-xs ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                        <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-dark-700 rounded transition-opacity touch-target" aria-label="More options">
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>

                      {/* Title */}
                      <h4 className="font-medium mb-2 line-clamp-2 text-sm">{task.title}</h4>

                      {/* Description */}
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {task.description}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span className={task.assignee === 'tee' ? 'text-brand-400' : 'text-purple-400'}>
                            {task.assignee === 'tee' ? 'Tee' : 'Robin'}
                          </span>
                        </div>
                        {task.estimatedHours && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{task.estimatedHours}h</span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {task.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="badge bg-dark-700 text-gray-400 text-xs">
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                          {task.tags.length > 2 && (
                            <span className="badge bg-dark-700 text-gray-400 text-xs">
                              +{task.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Workflow Indicator */}
                      <div className="mt-3 pt-3 border-t border-dark-600">
                        <div className="flex items-center gap-2">
                          {workflows.find(w => w.id === task.workflow)?.icon === 'music' && '🎵'}
                          {workflows.find(w => w.id === task.workflow)?.icon === 'home' && '🏠'}
                          {workflows.find(w => w.id === task.workflow)?.icon === 'bot' && '🤖'}
                          {workflows.find(w => w.id === task.workflow)?.icon === 'trending-up' && '📈'}
                          {workflows.find(w => w.id === task.workflow)?.icon === 'user' && '👤'}
                          <span className="text-xs text-gray-400 truncate">
                            {workflows.find(w => w.id === task.workflow)?.name}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile hint */}
      <p className="text-xs text-gray-500 text-center lg:hidden">
        Swipe horizontally to see all columns
      </p>
    </div>
  );
}
