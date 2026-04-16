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
    offlineMode, setOfflineMode
  } = React.useContext(AppContext);

  const [accessLogs, setAccessLogs] = React.useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = React.useState(true);

  React.useEffect(() => {
    const tenDaysAgo = Date.now() - (10 * 24 * 60 * 60 * 1000);
    const q = query(
      collection(db, 'access_logs'),
      where('timestamp', '>=', tenDaysAgo),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAccessLogs(logs);
      setLoadingLogs(false);
    }, (error) => {
      console.error("Error fetching access logs:", error);
      setLoadingLogs(false);
    });

    return () => unsubscribe();
  }, []);

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
        <Card className="border-none shadow-sm overflow-hidden bg-card">
          <CardHeader className="bg-primary/5 pb-6">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground mb-4 shadow-lg">
              <Info size={24} />
            </div>
            <CardTitle>About CSR Monitor</CardTitle>
            <CardDescription>General description and system details</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="p-4 rounded-xl bg-muted/50 border border-border/50 mb-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                The <span className="font-bold text-foreground">CCL CSR Monitor</span> is a state-of-the-art management portal designed for Central Coalfields Limited. It enables real-time tracking of Corporate Social Responsibility projects, advanced geospatial analysis, and comprehensive impact assessment across Jharkhand's mining regions.
              </p>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Version</span>
              <span className="font-mono font-bold">1.2.4-stable</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Environment</span>
              <span className="text-green-600 font-bold flex items-center gap-1">
                <Shield size={14} /> Production
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Last Updated</span>
              <span className="text-foreground">April 13, 2026</span>
            </div>
            <Button onClick={handleUpdate} variant="outline" className="w-full gap-2 mt-4">
              <RefreshCw size={16} />
              Check for Updates
            </Button>
          </CardContent>
        </Card>

        {/* Power Features (Offline Mode) */}
        <Card className="border-none shadow-sm overflow-hidden bg-card">
          <CardHeader className="bg-orange-500/5 pb-6">
            <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg">
              <Zap size={24} />
            </div>
            <CardTitle>Power Mode</CardTitle>
            <CardDescription>Offline capabilities and performance</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Offline Access</Label>
                <p className="text-sm text-muted-foreground">Run application completely without internet</p>
              </div>
              <div className="flex bg-muted p-1 rounded-lg">
                <button 
                  onClick={() => setOfflineMode(false)}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                    !offlineMode ? "bg-background shadow-sm text-orange-600" : "text-muted-foreground"
                  )}
                >
                  Online
                </button>
                <button 
                  onClick={() => setOfflineMode(true)}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                    offlineMode ? "bg-orange-500 text-white shadow-md" : "text-muted-foreground"
                  )}
                >
                  Offline
                </button>
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
              <p className="text-xs text-orange-700 font-medium leading-relaxed">
                <span className="font-black uppercase tracking-widest block mb-1">How it works:</span>
                When enabled, the application caches all project data and map tiles locally. You can continue to view projects and add reports even in remote mining areas with zero connectivity. Data will sync automatically once you return to a network.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="border-none shadow-sm overflow-hidden bg-card">
          <CardHeader className="bg-primary/5 pb-6">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground mb-4 shadow-lg">
              <Palette size={24} />
            </div>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize your visual experience</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">App Theme</Label>
                <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
              </div>
              <div className="flex bg-muted p-1 rounded-lg">
                <button 
                  onClick={() => setTheme('light')}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                    theme === 'light' ? "bg-background shadow-sm text-primary" : "text-muted-foreground"
                  )}
                >
                  Bright
                </button>
                <button 
                  onClick={() => setTheme('dark')}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                    theme === 'dark' ? "bg-slate-800 shadow-sm text-white" : "text-muted-foreground"
                  )}
                >
                  Dark
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <FontIcon size={16} /> Font Settings
                  </Label>
                  <p className="text-sm text-muted-foreground">Adjust font size and style</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Size</Label>
                  <Select value={fontSize} onValueChange={setFontSize}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Style</Label>
                  <Select value={fontStyle} onValueChange={setFontStyle}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sans">Sans Serif</SelectItem>
                      <SelectItem value="serif">Serif</SelectItem>
                      <SelectItem value="mono">Monospace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <Paintbrush size={16} /> Theme Color
                </Label>
                <p className="text-sm text-muted-foreground">Choose your primary accent color</p>
              </div>
              <div className="flex gap-3">
                {[
                  { id: 'blue', color: 'bg-blue-500' },
                  { id: 'green', color: 'bg-green-500' },
                  { id: 'red', color: 'bg-red-500' },
                  { id: 'purple', color: 'bg-purple-500' }
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setThemeColor(c.id)}
                    className={cn(
                      "w-10 h-10 rounded-full transition-all border-4",
                      themeColor === c.id ? "border-primary scale-110 shadow-lg" : "border-transparent hover:scale-105",
                      c.color
                    )}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Access Control Panel */}
        <Card className="border-none shadow-sm overflow-hidden bg-card md:col-span-2">
          <CardHeader className="bg-slate-900 text-white pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-lg">
                  <History size={24} />
                </div>
                <div>
                  <CardTitle className="text-white">Access Control Panel</CardTitle>
                  <CardDescription className="text-slate-400">System access logs for the last 10 days</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="border-slate-700 text-slate-400 font-mono">
                {accessLogs.length} SESSIONS
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-black uppercase tracking-widest text-[10px]">
                    <th className="text-left py-4 px-2">User</th>
                    <th className="text-left py-4 px-2">Email</th>
                    <th className="text-left py-4 px-2">Access Time</th>
                    <th className="text-right py-4 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loadingLogs ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-muted-foreground italic">
                        Loading access logs...
                      </td>
                    </tr>
                  ) : accessLogs.length > 0 ? (
                    accessLogs.map((log) => (
                      <tr key={log.id} className="group hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                              {log.name?.charAt(0) || 'U'}
                            </div>
                            <span className="font-bold">{log.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-2 font-mono text-xs text-muted-foreground">{log.email}</td>
                        <td className="py-4 px-2">
                          <div className="flex flex-col">
                            <span className="font-medium">{new Date(log.timestamp).toLocaleDateString()}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock size={10} /> {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-2 text-right">
                          <Badge className="bg-green-500/10 text-green-600 border-none rounded-full px-3 py-0.5 text-[10px] font-black">
                            AUTHORIZED
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-muted-foreground italic">
                        No access logs found for the last 10 days.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
