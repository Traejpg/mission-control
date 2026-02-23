import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TaskBoard from './pages/TaskBoard';
import Trading from './pages/Trading';
import ContentPipeline from './pages/ContentPipeline';
import Calendar from './pages/Calendar';
import Memory from './pages/Memory';
import Team from './pages/Team';
import DigitalOffice from './pages/DigitalOffice';
import CommandCenter from './pages/CommandCenter';

// Chief of Staff & Rules Modules
import DailyBriefing from './pages/DailyBriefing';
import HealthTracker from './pages/HealthTracker';
import TokenMonitor from './pages/TokenMonitor';
import RulesEngine from './pages/RulesEngine';
import DelegationWorkflow from './pages/DelegationWorkflow';
import LeadCallingSafety from './pages/LeadCallingSafety';
import CommunicationTemplates from './pages/CommunicationTemplates';
import FileSharingHelper from './pages/FileSharingHelper';
import TaskLogging from './pages/TaskLogging';

function App() {
  return (
    <Layout>
      <Routes>
        {/* Core */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<TaskBoard />} />
        <Route path="/trading" element={<Trading />} />
        <Route path="/content-pipeline" element={<ContentPipeline />} />
        
        {/* Chief of Staff */}
        <Route path="/daily-briefing" element={<DailyBriefing />} />
        <Route path="/health" element={<HealthTracker />} />
        <Route path="/token-monitor" element={<TokenMonitor />} />
        
        {/* Rules & Protocols */}
        <Route path="/rules" element={<RulesEngine />} />
        <Route path="/delegate" element={<DelegationWorkflow />} />
        <Route path="/calling" element={<LeadCallingSafety />} />
        <Route path="/templates" element={<CommunicationTemplates />} />
        <Route path="/files" element={<FileSharingHelper />} />
        <Route path="/logging" element={<TaskLogging />} />
        
        {/* Original */}
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/memory" element={<Memory />} />
        <Route path="/team" element={<Team />} />
        <Route path="/office" element={<DigitalOffice />} />
        <Route path="/command" element={<CommandCenter />} />
      </Routes>
    </Layout>
  );
}

export default App;
