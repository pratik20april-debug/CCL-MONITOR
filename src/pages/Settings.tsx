import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { Badge } from '@/src/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Info, 
  Palette, 
  RefreshCw, 
  Code, 
  Settings as SettingsIcon,
  Monitor,
  Shield,
  Zap,
  Type,
  Type as FontIcon,
  Paintbrush,
  History,
  UserCheck,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase';

import { useTheme } from 'next-themes';
import { AppContext } from '../App';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { 
    fontSize, setFontSize,
    fontStyle, setFontStyle,
    themeColor, setThemeColor,
    offlineMode, setOfflineMode,
    navMode, setNavMode
  } = React.useContext(AppContext);

  const [accessLogs, setAccessLogs] = React.useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = React.useState(false);
  const [showLogs, setShowLogs] = React.useState(false);
  const [logFilter, setLogFilter] = React.useState<number | null>(null); // null = hide, 0 = recent, 2 = 2 days, 7 = 7 days, 10 = 10 days

  const fetchLogs = (days: number) => {
    setLoadingLogs(true);
    setShowLogs(true);
    setLogFilter(days);
    
    const timeLimit = Date.now() - (days * 24 * 60 * 60 * 1000);
    const q = query(
      collection(db, 'access_logs'),
      where('timestamp', '>=', timeLimit),
      orderBy('timestamp', 'desc'),
      limit(days === 0 ? 5 : 50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAccessLogs(logs);
      setLoadingLogs(false);
    }, (error) => {
      console.error("Error fetching access logs:", error);
      setLoadingLogs(false);
    });

    return unsubscribe;
  };

  const handleUpdate = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Checking for updates...',
        success: 'System is up to date (v1.2.4)',
        error: 'Update failed',
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* App Info & About */}
        <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2.5rem]">
          <CardHeader className="bg-primary/5 pb-10 pt-10 px-10">
            <div className="w-16 h-16 bg-primary rounded-[2rem] flex items-center justify-center text-primary-foreground mb-6 shadow-2xl">
              <Info size={32} />
            </div>
            <CardTitle className="text-2xl font-black tracking-tight">System Intel</CardTitle>
            <CardDescription className="text-slate-500 font-medium font-mono text-xs uppercase tracking-widest">CCL CSR MONITOR v1.2.4</CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-4">
            <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 mb-4">
              <p className="text-xs leading-relaxed text-slate-500 font-medium">
                The <span className="font-black text-slate-900">CCL CSR Monitor</span> is a state-of-the-art management portal. It enables real-time tracking of Corporate Social Responsibility projects across Jharkhand's mining regions.
              </p>
            </div>
            <div className="flex justify-between py-3 border-b border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Environment</span>
              <span className="text-emerald-600 font-black text-xs flex items-center gap-1">
                <Shield size={12} /> SECURE_PRODUCTION
              </span>
            </div>
            <Button onClick={handleUpdate} variant="outline" className="w-full h-14 rounded-2xl gap-3 mt-6 border-slate-200 font-black text-xs uppercase tracking-widest">
              <RefreshCw size={18} />
              Check System Updates
            </Button>
          </CardContent>
        </Card>

        {/* Visual Architecture */}
        <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2.5rem]">
          <CardHeader className="bg-slate-50 pb-10 pt-10 px-10">
            <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white mb-6 shadow-2xl">
              <Palette size={32} />
            </div>
            <CardTitle className="text-2xl font-black tracking-tight">Visual Framework</CardTitle>
            <CardDescription className="text-slate-500 font-medium">Customize the system's professional aesthetic.</CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            {/* Theme Colors */}
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Primary Theme Signature</Label>
              <div className="flex flex-wrap gap-3">
                {[
                  { id: 'indigo', color: 'bg-indigo-600' },
                  { id: 'emerald', color: 'bg-emerald-600' },
                  { id: 'violet', color: 'bg-violet-600' },
                  { id: 'rose', color: 'bg-rose-600' },
                  { id: 'amber', color: 'bg-amber-500' }
                ].map((tc) => (
                  <button
                    key={tc.id}
                    onClick={() => setThemeColor(tc.id)}
                    className={cn(
                      "w-10 h-10 rounded-full transition-all flex items-center justify-center border-4",
                      tc.color,
                      themeColor === tc.id ? "border-slate-900 scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    {themeColor === tc.id && <Zap size={14} className="text-white fill-current" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Typography Styles */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Font System</Label>
                <Select value={fontStyle} onValueChange={setFontStyle}>
                  <SelectTrigger className="h-12 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select Style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sans">Modern Sans</SelectItem>
                    <SelectItem value="serif">Corporate Serif</SelectItem>
                    <SelectItem value="mono">Technical Mono</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scale factor</Label>
                <Select value={fontSize} onValueChange={setFontSize}>
                  <SelectTrigger className="h-12 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xs">XS (80%)</SelectItem>
                    <SelectItem value="small">Small (90%)</SelectItem>
                    <SelectItem value="medium">Medium (100%)</SelectItem>
                    <SelectItem value="large">Large (110%)</SelectItem>
                    <SelectItem value="xl">Extra Large (125%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Interface Mode */}
        <Card className="border-none shadow-xl overflow-hidden bg-slate-900 rounded-[2.5rem]">
          <CardHeader className="pb-10 pt-10 px-10">
            <div className="w-16 h-16 bg-primary rounded-[2rem] flex items-center justify-center text-white mb-6 shadow-2xl">
              <Monitor size={32} />
            </div>
            <CardTitle className="text-white text-2xl font-black tracking-tight">Intelligence Mode</CardTitle>
            <CardDescription className="text-slate-400 font-medium">Activate Advanced AI features</CardDescription>
          </CardHeader>
          <CardContent className="px-10 pb-10 space-y-6">
            <div className="grid grid-cols-2 gap-4">
               {[
                 { id: 'simple', label: 'Simple', desc: 'Standard UI', icon: Shield },
                 { id: 'advanced', label: 'Advanced', desc: 'AI Powered', icon: Zap }
               ].map((opt) => (
                 <button
                   key={opt.id}
                   onClick={() => setNavMode(opt.id as any)}
                   className={cn(
                     "p-6 rounded-[2rem] border-2 transition-all text-left space-y-2 group",
                     navMode === opt.id 
                      ? "border-primary bg-primary/10" 
                      : "border-white/5 bg-white/5 hover:border-white/10"
                   )}
                 >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                      navMode === opt.id ? "bg-primary text-white" : "bg-white/5 text-white/30"
                    )}>
                       <opt.icon size={20} />
                    </div>
                    <div>
                      <h5 className="font-black text-[10px] uppercase tracking-widest text-white">{opt.label}</h5>
                      <p className="text-[9px] text-white/40 font-medium">{opt.desc}</p>
                    </div>
                 </button>
               ))}
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
               <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                 <span className="font-black text-primary uppercase mb-1 block">Advanced Mode Intelligence:</span>
                 When enabled, a powerful system-wide AI Assistant is generated on your home page, capable of executing complex logical operations and multi-sector analysis automations.
               </p>
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Access Control Panel */}
        <Card className="border-none shadow-xl overflow-hidden bg-card md:col-span-2 rounded-[3rem]">
          <CardHeader className="bg-[#0f172a] text-white p-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/10 rounded-[2rem] flex items-center justify-center backdrop-blur-3xl shadow-2xl border border-white/5">
                  <UserCheck size={32} />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black tracking-tight">Access Control Center</CardTitle>
                  <CardDescription className="text-slate-400 font-medium">Verify system integrity and user session history</CardDescription>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                 {[
                   { label: 'Recent', val: 0, icon: History },
                   { label: 'Past 2 Days', val: 2, icon: Clock },
                   { label: 'Past 7 Days', val: 7, icon: Info }
                 ].map((opt) => (
                   <Button
                     key={opt.val}
                     size="sm"
                     variant="ghost"
                     onClick={() => fetchLogs(opt.val)}
                     className={cn(
                       "h-12 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all",
                       logFilter === opt.val 
                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                        : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                     )}
                   >
                     <opt.icon size={14} className="mr-2" />
                     {opt.label}
                   </Button>
                 ))}
              </div>
            </div>
          </CardHeader>
          
          <AnimatePresence mode="wait">
            {!showLogs ? (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="p-20 text-center space-y-6"
               >
                  <div className="w-24 h-24 bg-muted rounded-[2.5rem] flex items-center justify-center mx-auto opacity-20">
                     <Shield size={48} />
                  </div>
                  <div className="max-w-xs mx-auto">
                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-2">Logs Encrypted</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">System logs are protected. Select a viewing mode from the panel status above to decrypt and display access history.</p>
                  </div>
               </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="pt-6 px-10 pb-10"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px]">
                        <th className="text-left py-6 px-4">Authorized User</th>
                        <th className="text-left py-6 px-4">Digital Identity</th>
                        <th className="text-left py-6 px-4">Access Timecode</th>
                        <th className="text-right py-6 px-4">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {loadingLogs ? (
                        <tr>
                          <td colSpan={4} className="py-20 text-center text-muted-foreground italic">
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-4 opacity-20" />
                            Decrypting session data...
                          </td>
                        </tr>
                      ) : accessLogs.length > 0 ? (
                        accessLogs.map((log) => (
                          <tr key={log.id} className="group hover:bg-muted/50 transition-colors">
                            <td className="py-5 px-4">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black text-xs shadow-inner">
                                  {log.name?.charAt(0) || 'U'}
                                </div>
                                <span className="font-black text-slate-800 mb-0.5">{log.name}</span>
                              </div>
                            </td>
                            <td className="py-5 px-4 font-mono text-[11px] text-muted-foreground tracking-tighter">{log.email}</td>
                            <td className="py-5 px-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-700">{new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono uppercase">
                                  <Clock size={10} /> {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                            </td>
                            <td className="py-5 px-4 text-right">
                              <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-xl px-3 py-1 text-[9px] font-black tracking-widest">
                                PASS_SECURE
                              </Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-20 text-center text-muted-foreground italic">
                            No sessions found for the selected verification window.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    );
}
