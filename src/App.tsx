import React from 'react';
import { Toaster, toast } from 'sonner';
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
import { doc, getDoc, setDoc, serverTimestamp, addDoc, collection as firestoreCollection } from 'firebase/firestore';

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
});

export default function App() {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('home');
  const [fontSize, setFontSize] = React.useState('medium');
  const [fontStyle, setFontStyle] = React.useState('sans');
  const [themeColor, setThemeColor] = React.useState('blue');
  const [offlineMode, setOfflineMode] = React.useState(localStorage.getItem('offlineMode') === 'true');
  const [language, setLanguage] = React.useState<'en' | 'hi'>((localStorage.getItem('language') as 'en' | 'hi') || 'en');

  React.useEffect(() => {
    const initOffline = async () => {
      if (offlineMode) {
        await enableOffline();
      }
    };
    initOffline();
    localStorage.setItem('offlineMode', offlineMode.toString());
  }, [offlineMode]);

  React.useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  React.useEffect(() => {
    // Apply font size and style to body
    const body = document.body;
    body.classList.remove('text-sm', 'text-base', 'text-lg', 'font-sans', 'font-serif', 'font-mono');
    
    if (fontSize === 'small') body.classList.add('text-sm');
    else if (fontSize === 'medium') body.classList.add('text-base');
    else if (fontSize === 'large') body.classList.add('text-lg');

    if (fontStyle === 'sans') body.classList.add('font-sans');
    else if (fontStyle === 'serif') body.classList.add('font-serif');
    else if (fontStyle === 'mono') body.classList.add('font-mono');

    // Apply theme color
    document.documentElement.style.setProperty('--primary', 
      themeColor === 'blue' ? 'oklch(0.55 0.15 240)' : 
      themeColor === 'green' ? 'oklch(0.6 0.15 150)' : 
      themeColor === 'red' ? 'oklch(0.55 0.2 25)' : 
      themeColor === 'purple' ? 'oklch(0.55 0.18 280)' : 'oklch(0.55 0.15 240)'
    );
    
    // Also update ring and other related variables if needed
    document.documentElement.style.setProperty('--ring', 
      themeColor === 'blue' ? 'oklch(0.55 0.15 240 / 0.5)' : 
      themeColor === 'green' ? 'oklch(0.6 0.15 150 / 0.5)' : 
      themeColor === 'red' ? 'oklch(0.55 0.2 25 / 0.5)' : 
      themeColor === 'purple' ? 'oklch(0.55 0.18 280 / 0.5)' : 'oklch(0.55 0.15 240 / 0.5)'
    );
  }, [fontSize, fontStyle, themeColor]);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...userData,
              role: ['prat@ccl.gov.in', 'john@ccl.gov.in', 'admin@ccl.gov.in'].includes(firebaseUser.email || '') ? 'ADMIN' : userData.role
            });
          } else {
            // This might happen if registration failed halfway
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || 'User',
              role: ['prat@ccl.gov.in', 'john@ccl.gov.in', 'admin@ccl.gov.in'].includes(firebaseUser.email || '') ? 'ADMIN' : 'CCL_EMPLOYEE'
            });
          }

          // Log user access
          try {
            await addDoc(firestoreCollection(db, 'access_logs'), {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || 'User',
              timestamp: Date.now(),
              date: new Date().toISOString().split('T')[0]
            });
          } catch (logError) {
            console.error("Error logging access:", logError);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: 'User',
            role: ['prat@ccl.gov.in', 'john@ccl.gov.in', 'admin@ccl.gov.in'].includes(firebaseUser.email || '') ? 'ADMIN' : 'CCL_EMPLOYEE'
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
      if (user?.isSuperAdmin) {
        setUser(null);
        toast.success("Super Admin logged out");
        return;
      }
      await signOut(auth);
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const handleSuperAdminLogin = (code: string) => {
    if (code === "G56AW0912PL") {
      setUser({
        uid: 'super-admin-id',
        name: 'Super Admin',
        email: 'admin@ccl.gov.in',
        role: 'ADMIN',
        isSuperAdmin: true
      });
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

  if (!user) {
    if (window.location.pathname === '/register-ngo') {
      return (
        <>
          <NGORegistration />
          <Toaster position="top-right" richColors />
        </>
      );
    }
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden lg:block space-y-6"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="text-primary font-black text-2xl tracking-tighter">CCL</div>
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-slate-900 leading-tight">
              Central Coalfields <br />
              <span className="text-primary">CSR Portal</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              A comprehensive monitoring system for Corporate Social Responsibility projects. 
              Track progress, manage documentation, and measure impact in real-time.
            </p>
            <div className="flex gap-4 items-center pt-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <img 
                    key={i}
                    src={`https://picsum.photos/seed/user${i}/40/40`} 
                    className="w-10 h-10 rounded-full border-2 border-white"
                    alt="User"
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
              <p className="text-sm font-medium text-slate-500">Joined by 500+ Employees</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <AuthTabs onSuperAdminLogin={handleSuperAdminLogin} />
          </motion.div>
        </div>
        <Toaster position="top-right" richColors />
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
        language, setLanguage
      }}>
        <DashboardLayout 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          userName={user.name}
          userRole={user.role}
          onLogout={handleLogout}
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
          
          <Toaster position="top-right" richColors />
        </DashboardLayout>
      </AppContext.Provider>
    </ThemeProvider>
  );
}
