import React from 'react';
import { Toaster, toast } from 'sonner';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import AuthTabs from './components/auth/AuthTabs';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProgressReport from './pages/ProgressReport';
import ProjectStatus from './pages/ProjectStatus';
import CompletedProjects from './pages/CompletedProjects';
import EliminatedProjects from './pages/EliminatedProjects';
import ProjectMOU from './pages/ProjectMOU';
import BudgetTracker from './pages/BudgetTracker';
import NGOManagement from './pages/NGOManagement';
import NGOTaskManager from './pages/NGOTaskManager';
import NGOEvidenceUpload from './pages/NGOEvidenceUpload';
import NGOFundStatus from './pages/NGOFundStatus';
import NGODocumentUpload from './pages/NGODocumentUpload';
import NGOQueriesSupport from './pages/NGOQueriesSupport';
import CSRInvitations from './pages/CSRInvitations';
import NGORegistration from './pages/NGORegistration';
import GISDashboard from './pages/GISDashboard';
import Settings from './pages/Settings';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, enableOffline } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, addDoc, collection as firestoreCollection } from 'firebase/firestore';
import { 
  Sparkles, 
  Cpu, 
  Bot, 
  Zap, 
  ShieldCheck, 
  Database,
  Search,
  MessageSquare,
  Activity,
  Building2,
  User,
  KeyRound,
  ChevronLeft
} from 'lucide-react';
import { ThemeProvider } from 'next-themes';

export const AppContext = React.createContext<{
  fontSize: string;
  setFontSize: (val: string) => void;
  fontStyle: string;
  setFontStyle: (val: string) => void;
  themeColor: string;
  setThemeColor: (val: string) => void;
  offlineMode: boolean;
  setOfflineMode: (val: boolean) => void;
  language: 'en' | 'hi';
  setLanguage: (val: 'en' | 'hi') => void;
  navMode: 'simple' | 'advanced';
  setNavMode: (val: 'simple' | 'advanced') => void;
}>({
  fontSize: 'medium',
  setFontSize: () => {},
  fontStyle: 'sans',
  setFontStyle: () => {},
  themeColor: 'blue',
  setThemeColor: () => {},
  offlineMode: false,
  setOfflineMode: () => {},
  language: 'en',
  setLanguage: () => {},
  navMode: 'simple',
  setNavMode: () => {},
});

function MainContent({ user, activeTab, setActiveTab, handleLogout }: any) {
  const { navMode, themeColor } = React.useContext(AppContext);

  const content = (
    <DashboardLayout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      userName={user.name}
      userRole={user.role}
      onLogout={handleLogout}
      isMobileView={false}
      isAdvancedMode={navMode === 'advanced'}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'home' && <Home onNavigate={setActiveTab} />}
          {activeTab === 'projects' && <Projects />}
          {activeTab === 'mou' && <ProjectMOU />}
          {activeTab === 'budget' && <BudgetTracker />}
          {activeTab === 'ngos' && <NGOManagement />}
          {activeTab === 'ngo-tasks' && <NGOTaskManager />}
          {activeTab === 'ngo-evidence' && <NGOEvidenceUpload />}
          {activeTab === 'ngo-funds' && <NGOFundStatus />}
          {activeTab === 'ngo-docs' && <NGODocumentUpload />} 
          {activeTab === 'ngo-support' && <NGOQueriesSupport />}
          {activeTab === 'invitations' && <CSRInvitations />}
          {activeTab === 'reports' && <ProgressReport />}
          {activeTab === 'status' && <ProjectStatus />}
          {activeTab === 'completed' && <CompletedProjects />}
          {activeTab === 'gis' && <GISDashboard />}
          {activeTab === 'eliminated' && user.role === 'ADMIN' && <EliminatedProjects />}
          {activeTab === 'settings' && <Settings />}
        </motion.div>
      </AnimatePresence>
    </DashboardLayout>
  );

  return content;
}

function App() {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('home');
  const [fontSize, setFontSize] = React.useState(localStorage.getItem('fontSize') || 'medium');
  const [fontStyle, setFontStyle] = React.useState(localStorage.getItem('fontStyle') || 'sans');
  const [themeColor, setThemeColor] = React.useState(localStorage.getItem('themeColor') || 'blue');
  const [offlineMode, setOfflineMode] = React.useState(localStorage.getItem('offlineMode') === 'true');
  const [language, setLanguage] = React.useState<'en' | 'hi'>((localStorage.getItem('language') as 'en' | 'hi') || 'en');
  const [navMode, setNavMode] = React.useState<'simple' | 'advanced'>((localStorage.getItem('navMode') as 'simple' | 'advanced') || 'simple');

  // Initialize Offline Capabilities
  React.useEffect(() => {
    enableOffline();
  }, []);

  // Styles sync
  React.useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    
    // Theme Color & Layout Sync
    html.setAttribute('data-theme-color', themeColor);
    localStorage.setItem('themeColor', themeColor);
    localStorage.setItem('navMode', navMode);

    // Font Style Sync
    body.classList.remove('font-sans', 'font-serif', 'font-mono', 'font-style-sans', 'font-style-serif', 'font-style-mono');
    body.classList.add(`font-style-${fontStyle}`);
    localStorage.setItem('fontStyle', fontStyle);

    // Font Size Sync (Global REM scaling)
    const sizeMap: Record<string, string> = {
      'xs': '12px',
      'small': '14px',
      'medium': '16px',
      'large': '18px',
      'xl': '20px',
      'massive': '24px'
    };
    
    html.style.fontSize = sizeMap[fontSize] || '16px';
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize, fontStyle, themeColor, navMode]);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const role = ['prat@ccl.gov.in', 'john@ccl.gov.in', 'admin@ccl.gov.in'].includes(firebaseUser.email || '') ? 'ADMIN' : userData.role;
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...userData, role });
            if (role === 'NGO') setActiveTab('ngos');
          } else {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || 'User',
              role: ['prat@ccl.gov.in', 'john@ccl.gov.in', 'admin@ccl.gov.in'].includes(firebaseUser.email || '') ? 'ADMIN' : 'CCL_EMPLOYEE'
            });
          }
        } catch (error) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: 'User',
            role: 'CCL_EMPLOYEE'
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const handleSuperAdminLogin = (code: string) => {
    if (code === "G56AW0912PL") {
      setUser({ uid: 'super-admin-id', name: 'Super Admin', email: 'admin@ccl.gov.in', role: 'ADMIN', isSuperAdmin: true });
      toast.success("Super Admin access granted!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading CSR Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <AppContext.Provider value={{ 
        fontSize, setFontSize,
        fontStyle, setFontStyle,
        themeColor, setThemeColor,
        offlineMode, setOfflineMode,
        language, setLanguage,
        navMode, setNavMode
      }}>
        <HashRouter>
          <Routes>
            <Route path="/register-ngo" element={<NGORegistration />} />
            <Route path="/login" element={!user ? <LoginPage onSuperAdminLogin={handleSuperAdminLogin} /> : <Navigate to="/" />} />
            <Route path="/" element={user ? <MainContent user={user} activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <Toaster position="top-right" richColors />
        </HashRouter>
      </AppContext.Provider>
    </ThemeProvider>
  );
}

function LoginPage({ onSuperAdminLogin }: { onSuperAdminLogin: (code: string) => void }) {
  const [persona, setPersona] = React.useState<'choice' | 'employee' | 'ngo' | 'admin'>('choice');

  return (
    <div className="min-h-screen prof-light-bg flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Professional Gradient Accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-[10%] -right-[5%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-6xl relative z-10 py-12">
        <AnimatePresence mode="wait">
          {persona === 'choice' && (
            <motion.div 
              key="choice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-16"
            >
              <div className="text-center space-y-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="inline-flex items-center gap-3 px-5 py-2 bg-slate-100 border border-slate-200 rounded-full"
                >
                  <Building2 size={14} className="text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Central Coalfields Limited • CSR Monitoring</span>
                </motion.div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 leading-tight">
                  Institutional <br/>
                  <span className="prof-text-gradient italic">Governance Portal</span>
                </h1>
                <p className="text-slate-500 font-medium text-lg max-w-xl mx-auto leading-relaxed">
                  Secure access gateway for organizational monitoring and social impact coordination.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {/* Employee Card */}
                <motion.button
                  whileHover={{ y: -5 }}
                  onClick={() => setPersona('employee')}
                  className="prof-card group p-8 rounded-[2.5rem] hover:border-primary/50 transition-all text-left flex flex-col items-center text-center space-y-6"
                >
                  <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <User size={36} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Personnel</h3>
                    <p className="text-slate-500 text-sm leading-relaxed px-4">Internal CSR audits and project governance tools.</p>
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity">Enter Dashboard →</span>
                  </div>
                </motion.button>

                {/* NGO Card */}
                <motion.button
                  whileHover={{ y: -5 }}
                  onClick={() => setPersona('ngo')}
                  className="prof-card group p-8 rounded-[2.5rem] hover:border-emerald-500/50 transition-all text-left flex flex-col items-center text-center space-y-6"
                >
                  <div className="w-20 h-20 rounded-3xl bg-emerald-500/5 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                    <ShieldCheck size={36} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Partners</h3>
                    <p className="text-slate-500 text-sm leading-relaxed px-4">Field synchronization and impact reporting modules.</p>
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">Access Gateway →</span>
                  </div>
                </motion.button>

                {/* Admin Card */}
                <motion.button
                  whileHover={{ y: -5 }}
                  onClick={() => setPersona('admin')}
                  className="prof-card group p-8 rounded-[2.5rem] hover:border-slate-900 transition-all text-left flex flex-col items-center text-center space-y-6 border-slate-300/50 bg-slate-50 shadow-none"
                >
                  <div className="w-20 h-20 rounded-3xl bg-slate-900/5 flex items-center justify-center text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                    <KeyRound size={36} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Admin</h3>
                    <p className="text-slate-500 text-sm leading-relaxed px-4">System infrastructure and access control management.</p>
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity">System Override →</span>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {(persona === 'employee' || persona === 'ngo' || persona === 'admin') && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto w-full"
            >
              <div className="mb-8 text-center">
                <button 
                  onClick={() => setPersona('choice')}
                  className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-[10px] font-black uppercase tracking-widest mb-6"
                >
                  <ChevronLeft size={16} /> Change Access Type
                </button>
                <h2 className="text-4xl font-black tracking-tight text-slate-900 uppercase">
                  {persona === 'employee' ? 'CCL Entry' : persona === 'ngo' ? 'NGO Gateway' : 'Security Access'}
                </h2>
                <div className="w-12 h-1 bg-primary mx-auto mt-4 rounded-full" />
              </div>

              <div className="prof-card p-10 rounded-[3rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16" />
                <AuthTabs 
                  onSuperAdminLogin={onSuperAdminLogin} 
                  initialTab={persona === 'admin' ? 'admin' : persona === 'ngo' ? 'ngo' : 'employee'} 
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
