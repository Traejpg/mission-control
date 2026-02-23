import { useState } from 'react';
import { 
  Plus, 
  Calendar, 
  User,
  Eye,
  Image as ImageIcon, 
  FileText, 
  Video,
  Mic,
  Mail,
  Share2,
  ChevronRight,
  ChevronLeft,
  Trash2,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { workflows } from '../data/store';
import { contentItems as initialContentItems } from '../data/contentStore';
import type { ContentItem, ContentStage, ContentType, WorkflowType, ContentImage } from '../types';
import ContentEditor from '../components/ContentEditor';

const stages: { id: ContentStage; title: string; color: string; icon: any }[] = [
  { id: 'ideas', title: 'Ideas', color: 'gray', icon: FileText },
  { id: 'outline', title: 'Outline', color: 'blue', icon: FileText },
  { id: 'script', title: 'Script', color: 'indigo', icon: FileText },
  { id: 'visuals', title: 'Visuals', color: 'purple', icon: ImageIcon },
  { id: 'review', title: 'Review', color: 'yellow', icon: Eye },
  { id: 'publish', title: 'Publish', color: 'green', icon: Share2 },
];

const contentTypes: { id: ContentType; label: string; icon: any }[] = [
  { id: 'video', label: 'Video', icon: Video },
  { id: 'blog', label: 'Blog', icon: FileText },
  { id: 'social', label: 'Social', icon: Share2 },
  { id: 'ad', label: 'Ad', icon: BarChart3 },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'podcast', label: 'Podcast', icon: Mic },
];

const priorityColors = {
  low: 'bg-gray-500/20 text-gray-400',
  medium: 'bg-blue-500/20 text-blue-400',
  high: 'bg-orange-500/20 text-orange-400',
  critical: 'bg-red-500/20 text-red-400',
};

const stageColors = {
  ideas: 'border-gray-500/30',
  outline: 'border-blue-500/30',
  script: 'border-indigo-500/30',
  visuals: 'border-purple-500/30',
  review: 'border-yellow-500/30',
  publish: 'border-green-500/30',
};

export default function ContentPipeline() {
  const [contentItems, setContentItems] = useState<ContentItem[]>(initialContentItems);
  const [filterWorkflow, setFilterWorkflow] = useState<WorkflowType | 'all'>('all');
  const [filterType, setFilterType] = useState<ContentType | 'all'>('all');
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  const filteredItems = contentItems.filter(item => {
    if (filterWorkflow !== 'all' && item.workflow !== filterWorkflow) return false;
    if (filterType !== 'all' && item.type !== filterType) return false;
    return true;
  });

  const getItemsByStage = (stage: ContentStage) => 
    filteredItems.filter(item => item.stage === stage);

  const handleCreateItem = (item: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt' | 'images' | 'attachments'>) => {
    const newItem: ContentItem = {
      ...item,
      id: `content-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      images: [],
      attachments: [],
    };
    setContentItems(prev => [...prev, newItem]);
    setIsCreating(false);
  };

  const handleUpdateItem = (id: string, updates: Partial<ContentItem>) => {
    setContentItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, ...updates, updatedAt: new Date() }
        : item
    ));
  };

  const handleDeleteItem = (id: string) => {
    setContentItems(prev => prev.filter(item => item.id !== id));
    setSelectedItem(null);
  };

  const handleMoveStage = (itemId: string, direction: 'left' | 'right') => {
    const item = contentItems.find(i => i.id === itemId);
    if (!item) return;
    
    const currentStageIndex = stages.findIndex(s => s.id === item.stage);
    const newStageIndex = direction === 'left' 
      ? Math.max(0, currentStageIndex - 1)
      : Math.min(stages.length - 1, currentStageIndex + 1);
    
    handleUpdateItem(itemId, { stage: stages[newStageIndex].id });
  };

  const handleImageUpload = (itemId: string, files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: ContentImage = {
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: e.target?.result as string,
          filename: file.name,
          size: file.size,
          uploadedAt: new Date(),
        };
        
        const item = contentItems.find(i => i.id === itemId);
        if (item) {
          handleUpdateItem(itemId, {
            images: [...item.images, newImage]
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (itemId: string, imageId: string) => {
    const item = contentItems.find(i => i.id === itemId);
    if (item) {
      handleUpdateItem(itemId, {
        images: item.images.filter(img => img.id !== imageId)
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Pipeline</h1>
          <p className="text-gray-400 mt-1">Manage content from ideas to published</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Content
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-4">
        {stages.map(stage => {
          const count = getItemsByStage(stage.id).length;
          const Icon = stage.icon;
          return (
            <div key={stage.id} className="card">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${stage.color}-500/20`}>
                  <Icon className={`w-5 h-5 text-${stage.color}-400`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-gray-400">{stage.title}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <select 
          value={filterWorkflow}
          onChange={(e) => setFilterWorkflow(e.target.value as WorkflowType | 'all')}
          className="input text-sm py-1.5"
        >
          <option value="all">All Workflows</option>
          {workflows.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <select 
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as ContentType | 'all')}
          className="input text-sm py-1.5"
        >
          <option value="all">All Types</option>
          {contentTypes.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-6 gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageItems = getItemsByStage(stage.id);
          return (
            <div key={stage.id} className="flex flex-col min-w-[220px]">
              {/* Column Header */}
              <div className={`flex items-center justify-between mb-3 p-3 rounded-lg bg-dark-800 border-t-4 ${stageColors[stage.id]}`}>
                <div className="flex items-center gap-2">
                  <stage.icon className={`w-4 h-4 text-${stage.color}-400`} />
                  <h3 className="font-bold text-sm">{stage.title}</h3>
                </div>
                <span className="badge bg-dark-700 text-gray-400">
                  {stageItems.length}
                </span>
              </div>

              {/* Items */}
              <div className="space-y-3">
                <AnimatePresence>
                  {stageItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedItem(item)}
                      className="card-hover cursor-pointer group relative"
                    >
                      {/* Stage Navigation */}
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleMoveStage(item.id, 'left'); }}
                          className="p-1 bg-dark-700 rounded-full hover:bg-brand-600 transition-colors"
                          disabled={item.stage === 'ideas'}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleMoveStage(item.id, 'right'); }}
                          className="p-1 bg-dark-700 rounded-full hover:bg-brand-600 transition-colors"
                          disabled={item.stage === 'publish'}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Priority Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`badge text-xs ${priorityColors[item.priority]}`}>
                          {item.priority}
                        </span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Type & Title */}
                      <div className="flex items-center gap-2 mb-2">
                        {contentTypes.find(t => t.id === item.type)?.icon && (
                          <span className="text-gray-400">
                            {(() => {
                              const TypeIcon = contentTypes.find(t => t.id === item.type)?.icon;
                              return TypeIcon ? <TypeIcon className="w-4 h-4" /> : null;
                            })()}
                          </span>
                        )}
                        <h4 className="font-medium text-sm line-clamp-2">{item.title}</h4>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                        {item.description}
                      </p>

                      {/* Images Preview */}
                      {item.images.length > 0 && (
                        <div className="flex gap-1 mb-3">
                          {item.images.slice(0, 3).map((img) => (
                            <div key={img.id} className="relative w-8 h-8 rounded overflow-hidden">
                              <img src={img.url} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                          {item.images.length > 3 && (
                            <div className="w-8 h-8 rounded bg-dark-700 flex items-center justify-center text-xs text-gray-400">
                              +{item.images.length - 3}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Meta */}
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3" />
                          <span className={item.assignee === 'tee' ? 'text-brand-400' : 'text-purple-400'}>
                            {item.assignee === 'tee' ? 'Tee' : 'Robin'}
                          </span>
                        </div>
                        {item.scheduledDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(item.scheduledDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="badge bg-dark-700 text-gray-400 text-xs">
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 2 && (
                            <span className="badge bg-dark-700 text-gray-400 text-xs">
                              +{item.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(isCreating || editingItem || selectedItem) && (
          <ContentEditor
            item={selectedItem || editingItem}
            isCreating={isCreating}
            onClose={() => { setIsCreating(false); setEditingItem(null); setSelectedItem(null); }}
            onSave={isCreating ? handleCreateItem : (updates) => {
              if (selectedItem) handleUpdateItem(selectedItem.id, updates);
              setSelectedItem(null);
              setEditingItem(null);
            }}
            onDelete={selectedItem ? () => handleDeleteItem(selectedItem.id) : undefined}
            onImageUpload={selectedItem ? (files) => handleImageUpload(selectedItem.id, files) : undefined}
            onRemoveImage={selectedItem ? (imageId) => handleRemoveImage(selectedItem.id, imageId) : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
