import { useState } from 'react';
import { 
  FolderOpen, 
  FileText, 
  Image as ImageIcon, 
  Film,
  Music,
  File,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  Info,
  ExternalLink,
  Send,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

// File type definitions
const FILE_TYPES = {
  image: { icon: ImageIcon, color: 'purple', extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'] },
  video: { icon: Film, color: 'red', extensions: ['.mp4', '.mov', '.avi', '.mkv', '.webm'] },
  audio: { icon: Music, color: 'yellow', extensions: ['.mp3', '.wav', '.m4a', '.ogg', '.aac'] },
  document: { icon: FileText, color: 'blue', extensions: ['.pdf', '.doc', '.docx', '.txt', '.md', '.json'] },
  other: { icon: File, color: 'gray', extensions: [] },
};

// Mock workspace files
const WORKSPACE_FILES = [
  { name: 'demo-restaurant.html', path: '/Users/assistattrae/.openclaw/workspace/demo-restaurant.html', size: '7.4 KB', type: 'document' },
  { name: 'demo-barbershop.html', path: '/Users/assistattrae/.openclaw/workspace/demo-barbershop.html', size: '9.2 KB', type: 'document' },
  { name: 'scale-ai-brochure.md', path: '/Users/assistattrae/.openclaw/workspace/scale-ai-brochure.md', size: '12.1 KB', type: 'document' },
  { name: 'trackgiant-marketing-assets.md', path: '/Users/assistattrae/.openclaw/workspace/trackgiant-marketing-assets.md', size: '15.8 KB', type: 'document' },
  { name: 'MEMORY.md', path: '/Users/assistattrae/.openclaw/workspace/MEMORY.md', size: '8.2 KB', type: 'document' },
];

export default function FileSharingHelper() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [mediaPath, setMediaPath] = useState('');

  const generateCopyCommand = (filePath: string) => {
    const filename = filePath.split('/').pop();
    return `cp "${filePath}" "$TMPDIR/${filename}"`;
  };

  const generateMediaPath = (filename: string) => {
    return `$TMPDIR/${filename}`;
  };

  const copyCommand = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(generateCopyCommand(selectedFile));
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  const handleFileSelect = (path: string) => {
    setSelectedFile(path);
    const filename = path.split('/').pop() || '';
    setMediaPath(generateMediaPath(filename));
  };

  const getFileIcon = (type: string) => {
    const fileType = FILE_TYPES[type as keyof typeof FILE_TYPES] || FILE_TYPES.other;
    const Icon = fileType.icon;
    return <Icon className={`w-5 h-5 text-${fileType.color}-400`} />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
            <FolderOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">File Sharing Helper</h1>
            <p className="text-gray-400">Secure file sharing for Telegram</p>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card border-l-4 border-l-yellow-500 bg-yellow-500/10"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-yellow-400">Why $TMPDIR is Required</h3>
            <p className="text-sm text-gray-300 mt-1">
              Telegram can only access files within the temporary directory ($TMPDIR) for security reasons. 
              Files in your workspace must be copied to $TMPDIR before they can be sent via the message tool.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-6">
        {/* File Browser */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-brand-400" />
            Workspace Files
          </h2>
          
          <div className="space-y-2">
            {WORKSPACE_FILES.map(file => (
              <button
                key={file.path}
                onClick={() => handleFileSelect(file.path)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                  selectedFile === file.path 
                    ? 'bg-brand-500/10 border-brand-500/50' 
                    : 'bg-dark-700/50 border-dark-600 hover:border-dark-500'
                }`}
              >
                {getFileIcon(file.type)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{file.size}</p>
                </div>
                {selectedFile === file.path && (
                  <CheckCircle2 className="w-5 h-5 text-brand-400" />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* File Transfer Steps */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* Step 1: Copy Command */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold">1</div>
              <h3 className="font-bold">Copy to $TMPDIR</h3>
            </div>
            
            {selectedFile ? (
              <>
                <div className="bg-dark-900 rounded-lg p-3 font-mono text-sm border border-dark-600">
                  <code className="text-green-400">$</code>{' '}
                  <code>{generateCopyCommand(selectedFile)}</code>
                </div>
                <button 
                  onClick={copyCommand}
                  className="mt-3 w-full btn-secondary flex items-center justify-center gap-2"
                >
                  {copiedCommand ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Command
                    </>
                  )}
                </button>
              </>
            ) : (
              <p className="text-gray-400 text-sm">Select a file from the workspace to generate the copy command.</p>
            )}
          </div>

          {/* Step 2: Media Path */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold">2</div>
              <h3 className="font-bold">Use Media Path</h3>
            </div>
            
            {mediaPath ? (
              <>
                <p className="text-sm text-gray-400 mb-2">Use this path in your message:</p>
                <div className="bg-dark-900 rounded-lg p-3 font-mono text-sm border border-dark-600">
                  <code className="text-brand-400">media: {mediaPath}</code>
                </div>
                <div className="mt-3 p-3 bg-dark-700/50 rounded-lg">
                  <p className="text-xs text-gray-400">Example message:</p>
                  <p className="text-sm font-mono mt-1">
                    Sending file: <span className="text-brand-400">{mediaPath}</span>
                  </p>
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-sm">Select a file to see the media path.</p>
            )}
          </div>

          {/* Quick Tip */}
          <div className="card bg-blue-500/10 border-blue-500/30">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-400">Pro Tip</h4>
                <p className="text-sm text-gray-300 mt-1">
                  Files in $TMPDIR are automatically cleaned up by the system. 
                  For permanent storage, keep originals in your workspace and copy to $TMPDIR only when sending.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Workflow Diagram */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <h2 className="text-xl font-bold mb-4">File Sharing Workflow</h2>
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center p-4 bg-dark-700/50 rounded-lg">
            <FolderOpen className="w-8 h-8 mx-auto mb-2 text-brand-400" />
            <p className="font-medium">1. Select File</p>
            <p className="text-xs text-gray-400">From workspace</p>
          </div>
          <ChevronRight className="w-6 h-6 text-gray-500" />
          <div className="flex-1 text-center p-4 bg-dark-700/50 rounded-lg">
            <Terminal className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
            <p className="font-medium">2. Copy Command</p>
            <p className="text-xs text-gray-400">To $TMPDIR</p>
          </div>
          <ChevronRight className="w-6 h-6 text-gray-500" />
          <div className="flex-1 text-center p-4 bg-dark-700/50 rounded-lg">
            <Send className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <p className="font-medium">3. Send</p>
            <p className="text-xs text-gray-400">Via message tool</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
