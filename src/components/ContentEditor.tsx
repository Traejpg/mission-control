import { useState, useRef } from 'react';
import { 
  X, 
  Save, 
  Trash2, 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  Video,
  Mic,
  Mail,
  Share2,
  BarChart3,
  Link,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { workflows } from '../data/store';
import type { ContentItem, ContentStage, ContentType, WorkflowType, ContentPlatform } from '../types';

const stages: { id: ContentStage; title: string }[] = [
  { id: 'ideas', title: 'Ideas' },
  { id: 'outline', title: 'Outline' },
  { id: 'script', title: 'Script' },
  { id: 'visuals', title: 'Visuals' },
  { id: 'review', title: 'Review' },
  { id: 'publish', title: 'Publish' },
];

const contentTypes: { id: ContentType; label: string; icon: any }[] = [
  { id: 'video', label: 'Video', icon: Video },
  { id: 'blog', label: 'Blog', icon: FileText },
  { id: 'social', label: 'Social', icon: Share2 },
  { id: 'ad', label: 'Ad', icon: BarChart3 },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'podcast', label: 'Podcast', icon: Mic },
];

const platforms: { id: ContentPlatform; label: string }[] = [
  { id: 'youtube', label: 'YouTube' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'twitter', label: 'Twitter' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'blog', label: 'Blog' },
  { id: 'email', label: 'Email' },
];

interface ContentEditorProps {
  item?: ContentItem | null;
  isCreating?: boolean;
  onClose: () => void;
  onSave: (item: any) => void;
  onDelete?: () => void;
  onImageUpload?: (files: FileList | null) => void;
  onRemoveImage?: (imageId: string) => void;
}

export default function ContentEditor({ 
  item, 
  isCreating, 
  onClose, 
  onSave, 
  onDelete,
  onImageUpload,
  onRemoveImage
}: ContentEditorProps) {
  const [formData, setFormData] = useState<Partial<ContentItem>>({
    title: '',
    description: '',
    stage: 'ideas',
    type: 'video',
    platform: 'youtube',
    workflow: 'trackgiant',
    assignee: 'tee',
    priority: 'medium',
    tags: [],
    outline: '',
    script: '',
    notes: '',
    scheduledDate: undefined,
    publishUrl: '',
    ...item,
  });
  
  const [newTag, setNewTag] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'outline' | 'script' | 'media' | 'publish'>('details');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onSave(formData);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({ 
        ...prev, 
        tags: [...(prev.tags || []), newTag.trim()] 
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({ 
      ...prev, 
      tags: prev.tags?.filter(t => t !== tag) || []
    }));
  };

  const moveStage = (direction: 'prev' | 'next') => {
    const currentIndex = stages.findIndex(s => s.id === formData.stage);
    const newIndex = direction === 'prev' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(stages.length - 1, currentIndex + 1);
    setFormData(prev => ({ ...prev, stage: stages[newIndex].id }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-dark-800 rounded-2xl border border-dark-600 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-600">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">
              {isCreating ? 'Create New Content' : 'Edit Content'}
            </h2>
            {!isCreating && item && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => moveStage('prev')}
                  disabled={formData.stage === 'ideas'}
                  className="p-1 hover:bg-dark-700 rounded disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="badge bg-brand-600/20 text-brand-400">
                  {stages.find(s => s.id === formData.stage)?.title}
                </span>
                <button 
                  onClick={() => moveStage('next')}
                  disabled={formData.stage === 'publish'}
                  className="p-1 hover:bg-dark-700 rounded disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isCreating && onDelete && (
              <button 
                onClick={onDelete}
                className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-dark-600">
          {[
            { id: 'details', label: 'Details', icon: FileText },
            { id: 'outline', label: 'Outline', icon: FileText },
            { id: 'script', label: 'Script', icon: FileText },
            { id: 'media', label: 'Media', icon: ImageIcon },
            ...(formData.stage === 'publish' ? [{ id: 'publish', label: 'Publish', icon: Share2 }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'text-brand-400 border-b-2 border-brand-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                <input 
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="input w-full"
                  placeholder="Enter content title..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input w-full h-24 resize-none"
                  placeholder="Brief description of the content..."
                />
              </div>

              {/* Type, Platform, Workflow */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ContentType }))}
                    className="input w-full"
                  >
                    {contentTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Platform</label>
                  <select 
                    value={formData.platform}
                    onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value as ContentPlatform }))}
                    className="input w-full"
                  >
                    {platforms.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Workflow</label>
                  <select 
                    value={formData.workflow}
                    onChange={(e) => setFormData(prev => ({ ...prev, workflow: e.target.value as WorkflowType }))}
                    className="input w-full"
                  >
                    {workflows.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assignee & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Assignee</label>
                  <select 
                    value={formData.assignee}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignee: e.target.value }))}
                    className="input w-full"
                  >
                    <option value="tee">Tee (You)</option>
                    <option value="robin">Robin (AI)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Priority</label>
                  <select 
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="input w-full"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Scheduled Date */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Scheduled Date</label>
                <input 
                  type="date"
                  value={formData.scheduledDate ? new Date(formData.scheduledDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    scheduledDate: e.target.value ? new Date(e.target.value) : undefined 
                  }))}
                  className="input w-full"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    className="input flex-1"
                    placeholder="Add a tag..."
                  />
                  <button 
                    onClick={handleAddTag}
                    className="btn-secondary"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags?.map((tag) => (
                    <span 
                      key={tag} 
                      className="badge bg-brand-600/20 text-brand-400 flex items-center gap-1"
                    >
                      {tag}
                      <button 
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Notes</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="input w-full h-32 resize-none"
                  placeholder="General notes and ideas..."
                />
              </div>
            </div>
          )}

          {/* Outline Tab */}
          {activeTab === 'outline' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Content Outline</h3>
                <span className="text-xs text-gray-400">Markdown supported</span>
              </div>
              <textarea 
                value={formData.outline}
                onChange={(e) => setFormData(prev => ({ ...prev, outline: e.target.value }))}
                className="input w-full h-96 font-mono text-sm resize-none"
                placeholder={`# Outline

## Introduction
- Hook
- Problem statement
- Solution preview

## Main Points
1. First point
2. Second point
3. Third point

## Conclusion
- Summary
- Call to action`}
              />
            </div>
          )}

          {/* Script Tab */}
          {activeTab === 'script' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Full Script</h3>
                <span className="text-xs text-gray-400">For video/podcast content</span>
              </div>
              <textarea 
                value={formData.script}
                onChange={(e) => setFormData(prev => ({ ...prev, script: e.target.value }))}
                className="input w-full h-96 font-mono text-sm resize-none"
                placeholder={`[INTRO]
Write your script here...

[SEGMENT 1]
...

[OUTRO]
...`}
              />
            </div>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Images & Attachments</h3>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Images
                </button>
                <input 
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => onImageUpload?.(e.target.files)}
                  className="hidden"
                />
              </div>

              {item?.images && item.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {item.images.map((img) => (
                    <div key={img.id} className="relative group">
                      <div className="aspect-video rounded-lg overflow-hidden bg-dark-700">
                        <img 
                          src={img.url} 
                          alt={img.filename}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <button 
                          onClick={() => onRemoveImage?.(img.id)}
                          className="p-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 truncate">{img.filename}</p>
                      {img.caption && (
                        <p className="text-xs text-gray-500">{img.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No images uploaded yet</p>
                  <p className="text-sm mt-1">Click Upload Images to add attachments</p>
                </div>
              )}
            </div>
          )}

          {/* Publish Tab */}
          {activeTab === 'publish' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Publish URL</label>
                <div className="flex gap-2">
                  <input 
                    type="url"
                    value={formData.publishUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, publishUrl: e.target.value }))}
                    className="input flex-1"
                    placeholder="https://..."
                  />
                  {formData.publishUrl && (
                    <a 
                      href={formData.publishUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary flex items-center gap-2"
                    >
                      <Link className="w-4 h-4" />
                      Open
                    </a>
                  )}
                </div>
              </div>

              {item?.analytics && (
                <div className="card">
                  <h4 className="font-medium mb-4">Analytics</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{item.analytics.views || 0}</p>
                      <p className="text-xs text-gray-400">Views</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{item.analytics.likes || 0}</p>
                      <p className="text-xs text-gray-400">Likes</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{item.analytics.comments || 0}</p>
                      <p className="text-xs text-gray-400">Comments</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{item.analytics.shares || 0}</p>
                      <p className="text-xs text-gray-400">Shares</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-dark-600">
          <div className="text-sm text-gray-400">
            {item?.createdAt && (
              <span>Created {new Date(item.createdAt).toLocaleDateString()}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isCreating ? 'Create' : 'Save Changes'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
