import { useState } from 'react';
import { 
  MessageSquare, 
  Copy, 
  CheckCircle2, 
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Clock,
  Users,
  CheckSquare,
  Sun,
  Moon,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Template {
  id: string;
  category: 'delegation' | 'check-in' | 'briefing' | 'custom';
  title: string;
  template: string;
  variables: string[];
}

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'start',
    category: 'delegation',
    title: 'START - Delegation Begin',
    template: 'Delegating "{{task}}" to {{agent}}... ETA: {{eta}}',
    variables: ['task', 'agent', 'eta'],
  },
  {
    id: 'progress',
    category: 'delegation',
    title: 'PROGRESS - Status Update',
    template: '{{progress}}% complete — {{chunkDescription}}',
    variables: ['progress', 'chunkDescription'],
  },
  {
    id: 'finish',
    category: 'delegation',
    title: 'FINISH - Task Complete',
    template: '✅ "{{task}}" complete. {{summary}}',
    variables: ['task', 'summary'],
  },
  {
    id: 'morning-briefing',
    category: 'briefing',
    title: '8am Morning Briefing',
    template: `Good morning! Here's today's briefing:

🎯 Top 3 Priorities:
1. {{priority1}}
2. {{priority2}}
3. {{priority3}}

💪 Gym: Day {{gymDay}} - {{workout}}
📈 Stock Play: {{stockPlay}}
⚠️ Avoid: {{distraction}}`,
    variables: ['priority1', 'priority2', 'priority3', 'gymDay', 'workout', 'stockPlay', 'distraction'],
  },
  {
    id: 'midday-checkin',
    category: 'check-in',
    title: '12pm Midday Check-In',
    template: `Midday check-in:

▸ Currently working on: {{currentTask}}
▸ Completed this morning: {{completed}}
▸ Behind on: {{behind}}
▸ Next 2 hours: {{nextFocus}}`,
    variables: ['currentTask', 'completed', 'behind', 'nextFocus'],
  },
  {
    id: 'afternoon-push',
    category: 'check-in',
    title: '4pm Afternoon Push',
    template: `Afternoon push time! 

You're currently: {{currentActivity}}

Recommended: Switch to {{recommendedTask}} for maximum leverage.`,
    variables: ['currentActivity', 'recommendedTask'],
  },
  {
    id: 'nightly-debrief',
    category: 'check-in',
    title: '8pm Nightly Debrief',
    template: `Evening debrief:

🏆 Wins today:
{{wins}}

❌ Misses:
{{misses}}

💪 Gym completed: {{gymStatus}}
🍽️ Nutrition: {{nutritionStatus}}
💰 Token usage: {{tokenUsage}}

🎯 Tomorrow's #1 priority: {{tomorrowPriority}}`,
    variables: ['wins', 'misses', 'gymStatus', 'nutritionStatus', 'tokenUsage', 'tomorrowPriority'],
  },
];

export default function CommunicationTemplates() {
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<Template>>({
    category: 'custom',
    title: '',
    template: '',
    variables: [],
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fillVariables = (template: string, variables: string[]) => {
    let filled = template;
    variables.forEach(v => {
      filled = filled.replace(new RegExp(`{{${v}}}`, 'g'), `[${v}]`);
    });
    return filled;
  };

  const saveTemplate = () => {
    if (!newTemplate.title || !newTemplate.template) return;
    
    const template: Template = {
      id: `custom-${Date.now()}`,
      category: newTemplate.category as 'custom',
      title: newTemplate.title,
      template: newTemplate.template,
      variables: newTemplate.variables || [],
    };
    
    setTemplates(prev => [...prev, template]);
    setShowEditor(false);
    setNewTemplate({ category: 'custom', title: '', template: '', variables: [] });
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'delegation': return Users;
      case 'briefing': return Sun;
      case 'check-in': return Clock;
      default: return MessageSquare;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'delegation': return 'blue';
      case 'briefing': return 'yellow';
      case 'check-in': return 'purple';
      default: return 'gray';
    }
  };

  const categories = ['delegation', 'briefing', 'check-in', 'custom'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-cyan-600 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Communication Templates</h1>
            <p className="text-gray-400">Quick-insert templates for consistent messaging</p>
          </div>
        </div>
        <button 
          onClick={() => setShowEditor(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Template
        </button>
      </div>

      {/* Templates by Category */}
      {categories.map(category => {
        const categoryTemplates = templates.filter(t => t.category === category);
        if (categoryTemplates.length === 0) return null;
        
        const Icon = getCategoryIcon(category);
        const color = getCategoryColor(category);
        
        return (
          <motion.div 
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 capitalize">
              <div className={`p-2 rounded-lg bg-${color}-500/20`}>
                <Icon className={`w-5 h-5 text-${color}-400`} />
              </div>
              {category} Templates
            </h2>
            
            <div className="space-y-3">
              {categoryTemplates.map(template => (
                <div 
                  key={template.id}
                  className="p-4 bg-dark-700/50 rounded-lg border border-dark-600 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold">{template.title}</h3>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => copyToClipboard(template.template, template.id)}
                        className="p-2 bg-dark-600 hover:bg-dark-500 rounded-lg transition-colors"
                      >
                        {copiedId === template.id ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      {template.id.startsWith('custom') && (
                        <button 
                          onClick={() => deleteTemplate(template.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-dark-800 rounded-lg p-3 font-mono text-sm text-gray-300 whitespace-pre-wrap">
                    {template.template}
                  </div>
                  
                  {template.variables.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {template.variables.map(v => (
                        <span key={v} className="badge bg-dark-600 text-gray-400 text-xs">
                          {'{{'}{v}{'}}'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}

      {/* New Template Modal */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-dark-800 rounded-2xl border border-dark-600 w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-dark-600">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-brand-400" />
                  Create Custom Template
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Template Name</label>
                  <input
                    type="text"
                    value={newTemplate.title}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Client Follow-up"
                    className="w-full input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Template Content</label>
                  <textarea
                    value={newTemplate.template}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, template: e.target.value }))}
                    placeholder="Use {{variable}} for auto-fill fields..."
                    className="w-full input h-32 resize-none font-mono text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Use {'{{variableName}}'} for fields that will be auto-filled
                  </p>
                </div>
              </div>
              <div className="p-6 border-t border-dark-600 flex justify-end gap-3">
                <button 
                  onClick={() => setShowEditor(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveTemplate}
                  disabled={!newTemplate.title || !newTemplate.template}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Save Template
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
