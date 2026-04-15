import React from 'react';
import { motion } from 'motion/react';
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
  Trash2
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
      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 w-full text-left",
      active 
        ? "bg-primary text-primary-foreground shadow-md" 
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
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

  const navItems = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'mou', label: 'Project MOU', icon: FileText },
    { id: 'reports', label: 'Progress Report', icon: FileText },
    { id: 'status', label: 'Project Status', icon: Activity },
    { id: 'completed', label: 'Completed Projects', icon: CheckCircle2 },
    { id: 'gis', label: 'GIS Dashboard', icon: MapIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
    { id: 'eliminated', label: 'Eliminated Projects', icon: Trash2 },
  ];

  return (
    <div className="min-h-screen bg-background flex overflow-hidden tech-grid">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-card/80 backdrop-blur-xl border-r flex flex-col z-50 relative shadow-2xl"
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <span className="font-black text-xl tracking-tighter text-foreground">CSR MONITOR</span>
            </motion.div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="ml-auto hover:bg-primary/10 transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-8">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={isSidebarOpen ? item.label : ''}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
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
      <main className="flex-1 overflow-auto relative flex flex-col">
        <header className="h-20 border-b border-border/50 bg-background/40 backdrop-blur-xl sticky top-0 z-40 flex items-center px-10 justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black capitalize tracking-tight text-foreground">{activeTab.replace('-', ' ')}</h1>
            <p className="text-xs text-muted-foreground font-medium">Central Coalfields CSR Management Portal</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Live System</span>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-foreground">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">System Status: Optimal</p>
            </div>
          </div>
        </header>
        <div className="p-10 max-w-7xl mx-auto w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
