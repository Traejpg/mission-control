import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Kanban, 
  Calendar as CalendarIcon, 
  Brain, 
  Users, 
  Building2, 
  Terminal,
  Search,
  Bell,
  Zap,
  TrendingUp,
  Clapperboard,
  Sun,
  Heart,
  Coins,
  Shield,
  UserCog,
  Phone,
  MessageSquare,
  FolderOpen,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { userProfile } from '../data/store';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  path: string;
  icon: any;
  label: string;
  shortcut?: string;
}

// Simplified nav for mobile - most important items
const mobileNavItems: NavItem[] = [
  { path: '/', icon: LayoutDashboard, label: 'Home', shortcut: '1' },
  { path: '/tasks', icon: Kanban, label: 'Tasks', shortcut: '2' },
  { path: '/memory', icon: Brain, label: 'Memory', shortcut: '3' },
  { path: '/team', icon: Users, label: 'Team', shortcut: '4' },
  { path: '/menu', icon: Menu, label: 'More', shortcut: '5' },
];

// Full nav for desktop sidebar
const navSections = [
  {
    title: 'Core',
    items: [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/tasks', icon: Kanban, label: 'Tasks' },
      { path: '/content-pipeline', icon: Clapperboard, label: 'Content' },
      { path: '/trading', icon: TrendingUp, label: 'Trading' },
    ],
  },
  {
    title: 'Chief of Staff',
    items: [
      { path: '/daily-briefing', icon: Sun, label: 'Daily Briefing' },
      { path: '/health', icon: Heart, label: 'Health & Gym' },
      { path: '/token-monitor', icon: Coins, label: 'Token Usage' },
    ],
  },
  {
    title: 'Rules & Protocols',
    items: [
      { path: '/rules', icon: Shield, label: 'Rules Engine' },
      { path: '/delegate', icon: UserCog, label: 'Delegation' },
      { path: '/calling', icon: Phone, label: 'Lead Calling' },
      { path: '/templates', icon: MessageSquare, label: 'Templates' },
      { path: '/files', icon: FolderOpen, label: 'File Sharing' },
      { path: '/logging', icon: ClipboardList, label: 'Task Logging' },
    ],
  },
  {
    title: 'System',
    items: [
      { path: '/calendar', icon: CalendarIcon, label: 'Calendar' },
      { path: '/memory', icon: Brain, label: 'Memory' },
      { path: '/team', icon: Users, label: 'Team' },
      { path: '/office', icon: Building2, label: 'Office' },
      { path: '/command', icon: Terminal, label: 'Command' },
    ],
  },
];

// All pages for mobile menu
const allPages: NavItem[] = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/tasks', icon: Kanban, label: 'Tasks' },
  { path: '/content-pipeline', icon: Clapperboard, label: 'Content' },
  { path: '/trading', icon: TrendingUp, label: 'Trading' },
  { path: '/daily-briefing', icon: Sun, label: 'Daily Briefing' },
  { path: '/health', icon: Heart, label: 'Health & Gym' },
  { path: '/token-monitor', icon: Coins, label: 'Token Usage' },
  { path: '/rules', icon: Shield, label: 'Rules Engine' },
  { path: '/delegate', icon: UserCog, label: 'Delegation' },
  { path: '/calling', icon: Phone, label: 'Lead Calling' },
  { path: '/templates', icon: MessageSquare, label: 'Templates' },
  { path: '/files', icon: FolderOpen, label: 'File Sharing' },
  { path: '/logging', icon: ClipboardList, label: 'Task Logging' },
  { path: '/calendar', icon: CalendarIcon, label: 'Calendar' },
  { path: '/memory', icon: Brain, label: 'Memory' },
  { path: '/team', icon: Users, label: 'Team' },
  { path: '/office', icon: Building2, label: 'Office' },
  { path: '/command', icon: Terminal, label: 'Command' },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Core', 'Chief of Staff', 'Rules & Protocols', 'System']));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleSection = (title: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const isActive = (path: string) => location.pathname === path;

  // Mobile Menu Overlay
  if (mobileMenuOpen) {
    return (
      <div className="fixed inset-0 bg-dark-900 z-50 flex flex-col">
        {/* Mobile Menu Header */}
        <header className="h-16 bg-dark-800 border-b border-dark-600 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-bold text-lg">Menu</h1>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 hover:bg-dark-700 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </header>

        {/* Mobile Menu Items */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {allPages.map((page) => {
              const Icon = page.icon;
              return (
                <NavLink
                  key={page.path}
                  to={page.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl transition-colors ${
                    isActive(page.path)
                      ? 'bg-brand-600/20 text-brand-400 border-2 border-brand-600/50'
                      : 'bg-dark-800 text-gray-400 border-2 border-transparent hover:bg-dark-700'
                  }`}
                >
                  <Icon className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium text-center">{page.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-dark-800 border-r border-dark-600 flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-dark-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Mission Control</h1>
              <p className="text-xs text-gray-400">{userProfile.name}'s Command</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
          {navSections.map((section) => {
            const isExpanded = expandedSections.has(section.title);
            return (
              <div key={section.title}>
                <button
                  onClick={() => toggleSection(section.title)}
                  className="flex items-center justify-between w-full px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-400 transition-colors"
                >
                  <span>{section.title}</span>
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="mt-1 space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                              isActive 
                                ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30' 
                                : 'text-gray-400 hover:bg-dark-700 hover:text-white'
                            }`
                          }
                        >
                          <Icon className="w-4 h-4" />
                          <span className="font-medium text-sm">{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Live Clock */}
        <div className="p-4 border-t border-dark-600">
          <div className="glass rounded-lg p-4 text-center">
            <p className="text-2xl font-mono font-bold text-brand-400">{currentTime}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        {/* Header - Desktop */}
        <header className="hidden lg:h-16 lg:bg-dark-800 lg:border-b lg:border-dark-600 lg:flex lg:items-center lg:justify-between lg:px-6">
          {/* Search Bar */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search tasks, memories, commands..."
                className="w-full bg-dark-700 border border-dark-600 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{userProfile.name}</p>
                <p className="text-xs text-gray-400">{userProfile.role}</p>
              </div>
              <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center text-xl">
                {userProfile.avatar}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden h-14 bg-dark-800 border-b border-dark-600 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold">MC</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400">{currentTime}</span>
            <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-sm">
              {userProfile.avatar}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-dark-800 border-t border-dark-600 safe-area-pb z-40">
          <div className="flex justify-around items-center">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path) || (item.path === '/menu' && mobileMenuOpen);
              
              if (item.path === '/menu') {
                return (
                  <button
                    key={item.path}
                    onClick={() => setMobileMenuOpen(true)}
                    className={`flex flex-col items-center justify-center py-3 px-4 min-h-[56px] min-w-[56px] rounded-lg transition-colors ${
                      mobileMenuOpen
                        ? 'text-brand-400'
                        : 'text-gray-400'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs mt-1">{item.label}</span>
                  </button>
                );
              }

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center py-3 px-4 min-h-[56px] min-w-[56px] rounded-lg transition-colors ${
                    active
                      ? 'text-brand-400'
                      : 'text-gray-400'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs mt-1">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
