import React from 'react';
import { Toaster, toast } from 'sonner';
import DashboardLayout from './components/layout/DashboardLayout';
import AuthTabs from './components/auth/AuthTabs';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProgressReport from './pages/ProgressReport';
import GPSTracking from './pages/GPSTracking';
import ProjectApproval from './pages/ProjectApproval';
import Settings from './pages/Settings';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { ThemeProvider } from 'next-themes';

export const AppContext = React.createContext<{
  advancedMode: boolean;
  setAdvancedMode: (val: boolean) => void;
  customHtml: string;
  setCustomHtml: (val: string) => void;
  fontSize: string;
  setFontSize: (val: string) => void;
  fontStyle: string;
  setFontStyle: (val: string) => void;
  themeColor: string;
  setThemeColor: (val: string) => void;
}>({
  advancedMode: false,
  setAdvancedMode: () => {},
  customHtml: '',
  setCustomHtml: () => {},
  fontSize: 'medium',
  setFontSize: () => {},
  fontStyle: 'sans',
  setFontStyle: () => {},
  themeColor: 'blue',
  setThemeColor: () => {},
});

export default function App() {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('home');
  const [advancedMode, setAdvancedMode] = React.useState(false);
  const [customHtml, setCustomHtml] = React.useState('');
  const [fontSize, setFontSize] = React.useState('medium');
  const [fontStyle, setFontStyle] = React.useState('sans');
  const [themeColor, setThemeColor] = React.useState('blue');

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
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...userDoc.data()
            });
          } else {
            // This might happen if registration failed halfway
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || 'User',
              role: 'CCL_EMPLOYEE' // Default fallback
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
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
      setLoading(false);
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
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-xl p-2 overflow-hidden">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/en/thumb/5/5f/Central_Coalfields_Limited_Logo.svg/512px-Central_Coalfields_Limited_Logo.svg.png" 
                  alt="CCL Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://www.coalindia.in/media/images/ccl.png';
                  }}
                />
              </div>
              <div className="h-12 w-px bg-slate-200" />
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
        advancedMode, setAdvancedMode, 
        customHtml, setCustomHtml,
        fontSize, setFontSize,
        fontStyle, setFontStyle,
        themeColor, setThemeColor
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
              {activeTab === 'home' && <Home />}
              {activeTab === 'projects' && <Projects />}
              {activeTab === 'reports' && <ProgressReport />}
              {activeTab === 'tracking' && <GPSTracking />}
              {activeTab === 'approval' && <ProjectApproval />}
              {activeTab === 'settings' && <Settings />}
            </motion.div>
          </AnimatePresence>
          
          {advancedMode && customHtml && (
            <div className="mt-12 p-6 border-2 border-dashed border-primary/20 rounded-3xl bg-primary/5">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Custom Advanced Feature
              </h3>
              <div dangerouslySetInnerHTML={{ __html: customHtml }} />
            </div>
          )}
          
          <Toaster position="top-right" richColors />
        </DashboardLayout>
      </AppContext.Provider>
    </ThemeProvider>
  );
}
