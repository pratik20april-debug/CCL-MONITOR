import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Map as MapIcon, 
  LogOut, 
  Menu,
  X,
  Activity,
  CheckCircle2,
  Settings as SettingsIcon,
  Trash2,
  Wallet,
  Building2,
  ListTodo,
  Camera,
  IndianRupee,
  FileUp,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Link as LinkIcon,
  Globe
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
  key?: string;
}

const NavItem = ({ icon: Icon, label, active, onClick }: NavItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 w-full text-left group relative overflow-hidden",
      active 
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
        : "text-muted-foreground hover:bg-muted/80 hover:scale-[1.01]"
    )}
  >
    <div className={cn(
      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300",
      active ? "bg-white/20" : "bg-muted group-hover:bg-primary/10 group-hover:text-primary"
    )}>
      <Icon size={18} />
    </div>
    <span className={cn("font-bold text-xs uppercase tracking-widest transition-colors", active ? "text-white" : "group-hover:text-foreground text-muted-foreground/70")}>{label}</span>
    {active && (
      <motion.div 
        layoutId="nav-active-bar"
        className="absolute left-0 top-0 w-1 h-full bg-white rounded-r-full"
      />
    )}
  </button>
);

export default function DashboardLayout({ 
  children, 
  activeTab, 
  setActiveTab,
  userName,
  userRole,
  onLogout
}: { 
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userName: string;
  userRole: string;
  onLogout: () => void;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [expandedSections, setExpandedSections] = React.useState<string[]>(['CSR', 'NGO']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section) 
        : [...prev, section]
    );
  };

  const navSections = [
    {
      title: 'Navigation',
      items: [
        { id: 'home', label: 'Home', icon: LayoutDashboard },
      ]
    },
    {
      title: 'CSR',
      items: [
        { id: 'projects', label: 'Projects', icon: Briefcase },
        { id: 'mou', label: 'Project MOU', icon: FileText },
        { id: 'budget', label: 'Budget Tracker', icon: Wallet },
        { id: 'status', label: 'Project Status', icon: Activity },
        { id: 'reports', label: 'Project Report', icon: FileText },
        { id: 'completed', label: 'Completed Project', icon: CheckCircle2 },
        { id: 'gis', label: 'Project Overview', icon: MapIcon },
        { id: 'invitations', label: 'Invitation Link', icon: LinkIcon, adminOnly: true },
      ]
    },
    {
      title: 'NGO',
      items: [
        { id: 'ngos', label: 'NGO Partner', icon: Building2 },
        { id: 'ngo-tasks', label: 'Task Manager', icon: ListTodo },
        { id: 'ngo-evidence', label: 'Evidence Upload', icon: Camera },
        { id: 'ngo-funds', label: 'Fund Status', icon: IndianRupee },
        { id: 'ngo-docs', label: 'Document Upload', icon: FileUp },
        { id: 'ngo-support', label: 'Queries and Support', icon: HelpCircle },
      ]
    },
    {
      title: 'Admin',
      items: [
        { id: 'settings', label: 'Settings', icon: SettingsIcon },
        { id: 'eliminated', label: 'Eliminated Projects', icon: Trash2, adminOnly: true },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background flex overflow-hidden tech-grid">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-card/80 backdrop-blur-xl border-r flex flex-col z-50 relative shadow-2xl"
      >
        <div className="p-8 flex items-center justify-between">
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
                <LayoutDashboard size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tighter text-foreground font-heading uppercase leading-none">CSR Portal</span>
                <span className="text-[9px] font-black tracking-[0.2em] text-muted-foreground/50 uppercase whitespace-nowrap">Central Coalfields</span>
              </div>
            </motion.div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-10 h-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all ml-auto"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        <nav className="flex-1 px-4 space-y-8 mt-4 overflow-y-auto no-scrollbar pb-10">
          {navSections.map((section) => {
            // Filter by adminOnly
            let filteredItems = section.items.filter(item => !item.adminOnly || userRole === 'ADMIN');
            
            // Further filter for NGO role: Only show NGO category
            if (userRole === 'NGO') {
              if (section.title !== 'NGO') {
                return null;
              }
            }

            if (filteredItems.length === 0) return null;
            
            const isExpanded = expandedSections.includes(section.title);
            const isCategory = section.title === 'CSR' || section.title === 'NGO';

            return (
              <div key={section.title} className="space-y-1">
                {isSidebarOpen && (
                  <button 
                    onClick={() => isCategory && toggleSection(section.title)}
                    className={cn(
                      "flex items-center justify-between w-full px-4 mb-2 group",
                      isCategory ? "cursor-pointer" : "cursor-default"
                    )}
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 group-hover:text-primary transition-colors">
                      {section.title}
                    </span>
                    {isCategory && (
                      <div className="text-muted-foreground/30 group-hover:text-primary transition-colors">
                        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </div>
                    )}
                  </button>
                )}
                
                <AnimatePresence initial={false}>
                  {(!isCategory || isExpanded || !isSidebarOpen) && (
                    <motion.div
                      initial={isCategory ? { height: 0, opacity: 0 } : false}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-1 overflow-hidden"
                    >
                      {filteredItems.map((item) => (
                        <NavItem
                          key={item.id}
                          icon={item.icon}
                          label={isSidebarOpen ? item.label : ''}
                          active={activeTab === item.id}
                          onClick={() => setActiveTab(item.id)}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          {isSidebarOpen && (
            <div className="mb-6 px-3 py-4 bg-muted/50 rounded-2xl border border-border/50">
              <p className="text-sm font-bold truncate text-foreground">{userName}</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1">{userRole}</p>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={onLogout}
            className={cn("w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all", !isSidebarOpen && "px-2")}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-bold">Logout</span>}
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative flex flex-col bg-slate-50/50">
        <header className="h-24 border-b border-border/50 bg-white/60 backdrop-blur-3xl sticky top-0 z-40 flex items-center px-12 justify-between">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black capitalize tracking-tighter text-foreground font-heading">{activeTab.replace('-', ' ')}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">CCL CSR Ecosystem</span>
              <div className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">{userRole} PANEL</span>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">System Status</span>
                <span className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-tighter">Verified & Optimal</span>
              </div>
            </div>
            <div className="text-right hidden sm:block border-l border-border/50 pl-8">
              <p className="text-sm font-black text-foreground font-heading tracking-tight">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <div className="flex items-center justify-end gap-2 mt-0.5">
                <Globe size={10} className="text-muted-foreground" />
                <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.1em]">Ranchi, JH, India</p>
              </div>
            </div>
          </div>
        </header>
        <div className="p-12 max-w-7xl mx-auto w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
