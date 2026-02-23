import { useState, useEffect } from 'react';
import { 
  Brain, 
  Plus, 
  Search, 
  Calendar,
  Clock,
  Save,
  Edit3,
  FileText,
  Tag,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFileWatcher } from '../hooks/useFileWatcher';

export default function Memory() {
  const {
    files,
    memories,
    isConnected,
    isWriting,
    lastUpdate,
    selectedFile,
    selectFile,
    writeFile,
    createFile,
    refresh
  } = useFileWatcher();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFileDate, setNewFileDate] = useState('');

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Filter memories
  const filteredMemories = memories.filter(memory => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      memory.title.toLowerCase().includes(query) ||
      memory.content.toLowerCase().includes(query) ||
      memory.tags.some(t => t.toLowerCase().includes(query))
    );
  });

  // Start editing a file
  const startEdit = (file: any) => {
    setEditingFile(file.date);
    setEditContent(file.content);
  };

  // Save edited file
  const saveEdit = async () => {
    if (!editingFile) return;
    
    const success = await writeFile(editingFile, editContent);
    if (success) {
      setEditingFile(null);
      setEditContent('');
    }
  };

  // Create new file
  const handleCreate = async () => {
    if (!newFileDate) return;
    
    const success = await createFile(newFileDate);
    if (success) {
      setShowCreateModal(false);
      setNewFileDate('');
      selectFile(newFileDate);
    }
  };

  // Format last update
  const formatLastUpdate = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Connection Status */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Brain className="w-8 h-8 text-brand-400" />
              Memory
            </h1>
            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              isConnected 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {isConnected ? (
                <><Wifi className="w-3 h-3" /> SYNCED</>
              ) : (
                <><WifiOff className="w-3 h-3" /> OFFLINE</>
              )}
            </span>
          </div>
          <p className="text-gray-400 mt-1">
            {files.length} files • {memories.length} memories
            {lastUpdate > 0 && (
              <span className="ml-2 text-xs text-gray-500">
                Updated {formatLastUpdate(lastUpdate)}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => refresh()}
            disabled={!isConnected}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-gray-400 ${isWriting ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Memory
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card">
          <p className="text-gray-400 text-sm">Memory Files</p>
          <p className="text-3xl font-bold">{files.length}</p>
        </div>
        <div className="card">
          <p className="text-gray-400 text-sm">Total Memories</p>
          <p className="text-3xl font-bold text-brand-400">{memories.length}</p>
        </div>
        <div className="card">
          <p className="text-gray-400 text-sm">Categories</p>
          <p className="text-3xl font-bold text-yellow-400">
            {new Set(memories.map(m => m.category)).size}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-400 text-sm">Tags</p>
          <p className="text-3xl font-bold text-purple-400">
            {new Set(memories.flatMap(m => m.tags)).size}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search memories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-600 rounded-lg focus:border-brand-500 focus:outline-none"
        />
      </div>

      {/* Files List */}
      <div className="grid grid-cols-2 gap-6">
        {/* File List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-400" />
            Memory Files
          </h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {files.map((file) => (
              <motion.div
                key={file.date}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedFile === file.date 
                    ? 'bg-brand-500/10 border-brand-500/30' 
                    : 'bg-dark-800 border-dark-600 hover:border-dark-500'
                }`}
                onClick={() => selectFile(file.date)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{formatDate(file.date)}</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {file.tasks.length} tasks • {file.memories.length} memories
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(file);
                      }}
                      className="p-1 hover:bg-dark-700 rounded"
                    >
                      <Edit3 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Selected File / Memories */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Brain className="w-5 h-5 text-brand-400" />
            Memories
          </h2>
          
          {filteredMemories.length === 0 ? (
            <div className="card text-center py-12">
              <Brain className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No memories found</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery ? 'Try a different search' : 'Select a file to view memories'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredMemories.map((memory) => (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-hover"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold">{memory.title}</h3>
                    <span className="badge bg-dark-700 text-gray-400 text-xs">
                      {memory.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-3 mb-3">
                    {memory.content}
                  </p>
                  <div className="flex items-center gap-2">
                    {memory.tags.map(tag => (
                      <span key={tag} className="badge bg-brand-500/20 text-brand-400 text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {new Date(memory.date).toLocaleDateString()}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setEditingFile(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-dark-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Edit {editingFile}.md</h2>
                <div className="flex items-center gap-2">
                  {isWriting && (
                    <span className="text-sm text-yellow-400 flex items-center gap-1">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  )}
                  <button
                    onClick={saveEdit}
                    disabled={isWriting}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => setEditingFile(null)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 min-h-[500px] p-4 bg-dark-900 border border-dark-600 rounded-lg font-mono text-sm resize-none focus:border-brand-500 focus:outline-none"
                placeholder="# Memory content..."
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-dark-800 rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">Create New Memory File</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Date (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={newFileDate}
                    onChange={(e) => setNewFileDate(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!newFileDate}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Status Footer */}
      <div className={`p-4 rounded-lg border ${
        isConnected 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-red-500/10 border-red-500/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <Wifi className="w-5 h-5 text-green-400" />
                <div>
                  <p className="font-medium text-green-400">File Watcher Connected</p>
                  <p className="text-sm text-gray-400">
                    Two-way sync active • {files.length} files monitored
                  </p>
                </div>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-red-400" />
                <div>
                  <p className="font-medium text-red-400">File Watcher Disconnected</p>
                  <p className="text-sm text-gray-400">Attempting to reconnect...</p>
                </div>
              </>
            )}
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>Backend: ws://127.0.0.1:18791/ws</p>
            <p>Last update: {formatLastUpdate(lastUpdate)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
