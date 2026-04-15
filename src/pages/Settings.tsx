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
  Paintbrush
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';

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
      </div>
    </div>
  );
}
