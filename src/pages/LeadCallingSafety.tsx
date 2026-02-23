import { useState, useEffect } from 'react';
import { 
  Phone, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Clock,
  MessageSquare,
  Voicemail,
  UserX,
  PhoneOff,
  PhoneCall,
  ArrowRight,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  List,
  History,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

// Call outcome types matching SMS alert system
const OUTCOME_TYPES = [
  { id: 'hot_transfer', label: 'HOT Transfer', icon: PhoneCall, color: 'green', description: 'Connected and transferred to you' },
  { id: 'voicemail', label: 'Voicemail Left', icon: Voicemail, color: 'blue', description: 'Left voicemail with callback info' },
  { id: 'no_answer', label: 'No Answer', icon: UserX, color: 'yellow', description: 'No pickup after 4 rings' },
  { id: 'busy', label: 'Busy Signal', icon: PhoneOff, color: 'orange', description: 'Line was busy' },
  { id: 'failed', label: 'Call Failed', icon: XCircle, color: 'red', description: 'Technical failure' },
  { id: 'completed', label: 'Call Completed', icon: CheckCircle2, color: 'gray', description: 'Full conversation, no transfer' },
];

// Empty leads queue - add real leads via UI
const LEADS_QUEUE: { id: number; name: string; phone: string; status: string; lastAttempt: Date | null }[] = [];

// Empty call history - populated from real calls
const CALL_HISTORY: { id: number; leadName: string; phone: string; outcome: string; timestamp: Date; duration: number }[] = [];

// Empty SMS alerts - populated from real alerts
const SMS_ALERTS: { id: number; type: string; message: string; timestamp: Date }[] = [];

type CallStatus = 'idle' | 'calling' | 'completed';

export default function LeadCallingSafety() {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [currentLead, setCurrentLead] = useState<number | null>(null);
  const [leads, setLeads] = useState(LEADS_QUEUE);
  const [callHistory, setCallHistory] = useState(CALL_HISTORY);
  const [smsAlerts, setSmsAlerts] = useState(SMS_ALERTS);
  const [callTimer, setCallTimer] = useState(0);
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);

  // Timer for active call
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (callStatus === 'calling') {
      interval = setInterval(() => setCallTimer(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startCall = (leadId: number) => {
    if (callStatus !== 'idle') return;
    
    setCallStatus('calling');
    setCurrentLead(leadId);
    setCallTimer(0);
    
    // Update lead status
    setLeads(prev => prev.map(l => 
      l.id === leadId ? { ...l, status: 'calling' } : l
    ));
  };

  const endCall = (outcome: string) => {
    if (!currentLead) return;
    
    const lead = leads.find(l => l.id === currentLead);
    if (!lead) return;

    // Add to history
    const newCall = {
      id: Date.now(),
      leadName: lead.name,
      phone: lead.phone,
      outcome,
      timestamp: new Date(),
      duration: callTimer,
    };
    setCallHistory(prev => [newCall, ...prev]);

    // Add SMS alert
    const outcomeLabel = OUTCOME_TYPES.find(o => o.id === outcome)?.label || outcome;
    const newAlert = {
      id: Date.now(),
      type: outcome,
      message: `${outcomeLabel} at ${lead.name} (${lead.phone})`,
      timestamp: new Date(),
    };
    setSmsAlerts(prev => [newAlert, ...prev]);

    // Update lead
    setLeads(prev => prev.map(l => 
      l.id === currentLead ? { ...l, status: 'completed', lastAttempt: new Date() } : l
    ));

    // Reset
    setCallStatus('idle');
    setCurrentLead(null);
    setCallTimer(0);
    setShowOutcomeModal(false);
  };

  const completedCalls = callHistory.length;
  const hotTransfers = callHistory.filter(c => c.outcome === 'hot_transfer').length;
  const voicemails = callHistory.filter(c => c.outcome === 'voicemail').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Lead Calling Safety</h1>
            <p className="text-gray-400">Sequential calling with safety locks</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="card flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              callStatus === 'idle' ? 'bg-green-500' :
              callStatus === 'calling' ? 'bg-yellow-500 animate-pulse' :
              'bg-blue-500'
            }`} />
            <span className="font-medium">
              {callStatus === 'idle' ? 'Ready to Call' :
               callStatus === 'calling' ? 'Call in Progress' :
               'Call Completed'}
            </span>
          </div>
        </div>
      </div>

      {/* Safety Warning */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card border-l-4 border-l-red-500 bg-red-500/10"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-red-400">CRITICAL SAFETY RULES</h3>
            <ul className="mt-2 space-y-1 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-red-400" />
                Call leads 1 by 1 (sequential, NEVER batch)
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-red-400" />
                Wait for call completion before next call
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-red-400" />
                Never spawn subagents for calling
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-red-400" />
                User must direct each call individually
              </li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card bg-blue-500/10 border-blue-500/30">
          <p className="text-3xl font-bold">{completedCalls}</p>
          <p className="text-sm text-gray-400">Calls Today</p>
        </div>
        <div className="card bg-green-500/10 border-green-500/30">
          <p className="text-3xl font-bold text-green-400">{hotTransfers}</p>
          <p className="text-sm text-gray-400">HOT Transfers</p>
        </div>
        <div className="card bg-yellow-500/10 border-yellow-500/30">
          <p className="text-3xl font-bold text-yellow-400">{voicemails}</p>
          <p className="text-sm text-gray-400">Voicemails</p>
        </div>
        <div className="card">
          <p className="text-3xl font-bold">{leads.filter(l => l.status === 'pending').length}</p>
          <p className="text-sm text-gray-400">Remaining</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Active Call / Lead Queue */}
        <div className="space-y-4">
          {/* Active Call Card */}
          {callStatus === 'calling' && currentLead && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="card border-2 border-yellow-500 bg-yellow-500/10"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <PhoneCall className="w-6 h-6 text-yellow-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Call in Progress</h3>
                    <p className="text-3xl font-mono font-bold text-yellow-400">
                      {formatTime(callTimer)}
                    </p>
                  </div>
                </div>
              </div>
              
              {(() => {
                const lead = leads.find(l => l.id === currentLead);
                return lead ? (
                  <div className="p-4 bg-dark-700/50 rounded-lg mb-4">
                    <p className="font-bold text-lg">{lead.name}</p>
                    <p className="text-gray-400">{lead.phone}</p>
                  </div>
                ) : null;
              })()}

              <button 
                onClick={() => setShowOutcomeModal(true)}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <PhoneOff className="w-5 h-5" />
                End Call & Log Outcome
              </button>
            </motion.div>
          )}

          {/* Lead Queue */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <List className="w-6 h-6 text-brand-400" />
              Lead Queue
              <span className="badge bg-dark-700 text-gray-400">
                {leads.filter(l => l.status === 'pending').length} pending
              </span>
            </h2>
            <div className="space-y-2">
              {leads.filter(l => l.status === 'pending').map((lead, index) => (
                <div 
                  key={lead.id}
                  className="flex items-center justify-between p-3 bg-dark-700/50 rounded-lg border border-dark-600"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-dark-600 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-sm text-gray-400">{lead.phone}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => startCall(lead.id)}
                    disabled={callStatus !== 'idle'}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4" />
                    Call
                  </button>
                </div>
              ))}
              {leads.filter(l => l.status === 'pending').length === 0 && (
                <p className="text-gray-400 text-center py-4">All leads have been contacted today.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - SMS Alerts & History */}
        <div className="space-y-4">
          {/* SMS Alert Log */}
          <div className="card border-t-4 border-t-green-500">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-green-400" />
              SMS Alert Log
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {smsAlerts.map(alert => {
                const outcomeType = OUTCOME_TYPES.find(o => o.id === alert.type);
                const Icon = outcomeType?.icon || MessageSquare;
                return (
                  <div key={alert.id} className="flex items-start gap-3 p-3 bg-dark-700/30 rounded-lg">
                    <Icon className={`w-5 h-5 mt-0.5 text-${outcomeType?.color || 'gray'}-400`} />
                    <div className="flex-1">
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {alert.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Call History */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <History className="w-6 h-6 text-brand-400" />
              Call History
            </h2>
            <div className="space-y-2">
              {callHistory.map(call => {
                const outcomeType = OUTCOME_TYPES.find(o => o.id === call.outcome);
                const Icon = outcomeType?.icon || Phone;
                return (
                  <div key={call.id} className="flex items-center justify-between p-3 bg-dark-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-${outcomeType?.color || 'gray'}-500/20`}>
                        <Icon className={`w-4 h-4 text-${outcomeType?.color || 'gray'}-400`} />
                      </div>
                      <div>
                        <p className="font-medium">{call.leadName}</p>
                        <p className="text-xs text-gray-400">
                          {outcomeType?.label} • {call.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    {call.duration > 0 && (
                      <span className="text-sm text-gray-400">{formatTime(call.duration)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Outcome Selection Modal */}
      {showOutcomeModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowOutcomeModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-dark-800 rounded-2xl border border-dark-600 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-dark-600">
              <h3 className="text-xl font-bold">Select Call Outcome</h3>
              <p className="text-gray-400 text-sm mt-1">This will trigger SMS alert and log the result</p>
            </div>
            <div className="p-6 grid grid-cols-2 gap-3">
              {OUTCOME_TYPES.map(outcome => {
                const Icon = outcome.icon;
                return (
                  <button
                    key={outcome.id}
                    onClick={() => endCall(outcome.id)}
                    className={`p-4 rounded-lg border transition-all text-left ${
                      outcome.color === 'green' ? 'hover:bg-green-500/10 hover:border-green-500/30' :
                      outcome.color === 'blue' ? 'hover:bg-blue-500/10 hover:border-blue-500/30' :
                      outcome.color === 'yellow' ? 'hover:bg-yellow-500/10 hover:border-yellow-500/30' :
                      outcome.color === 'orange' ? 'hover:bg-orange-500/10 hover:border-orange-500/30' :
                      outcome.color === 'red' ? 'hover:bg-red-500/10 hover:border-red-500/30' :
                      'hover:bg-gray-500/10 hover:border-gray-500/30'
                    } border-dark-600`}
                  >
                    <Icon className={`w-6 h-6 mb-2 text-${outcome.color}-400`} />
                    <p className="font-medium">{outcome.label}</p>
                    <p className="text-xs text-gray-400 mt-1">{outcome.description}</p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
