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
    advancedMode, setAdvancedMode, 
    customHtml, setCustomHtml,
    fontSize, setFontSize,
    fontStyle, setFontStyle,
    themeColor, setThemeColor
  } = React.useContext(AppContext);
  const [localHtml, setLocalHtml] = React.useState(customHtml || '<!-- Add your custom HTML/JS here for new features -->\n<div id="custom-feature" style="padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">\n  <h4 style="color: #1e293b; font-weight: bold;">Custom Widget</h4>\n  <p style="color: #64748b; font-size: 14px;">This is a developer-injected feature.</p>\n</div>');

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

  const deployCode = () => {
    setCustomHtml(localHtml);
    toast.success("Custom code deployed successfully!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* App Info */}
        <Card className="border-none shadow-sm overflow-hidden bg-card">
          <CardHeader className="bg-primary/5 pb-6">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground mb-4 shadow-lg">
              <Info size={24} />
            </div>
            <CardTitle>App Information</CardTitle>
            <CardDescription>System details and versioning</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
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
              <span className="text-foreground">April 11, 2026</span>
            </div>
            <Button onClick={handleUpdate} variant="outline" className="w-full gap-2 mt-4">
              <RefreshCw size={16} />
              Check for Updates
            </Button>
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

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="space-y-0.5">
                <Label className="text-base">System Mode</Label>
                <p className="text-sm text-muted-foreground">Toggle between Default and Advanced</p>
              </div>
              <div className="flex bg-muted p-1 rounded-lg">
                <button 
                  onClick={() => setAdvancedMode(false)}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                    !advancedMode ? "bg-background shadow-sm text-primary" : "text-muted-foreground"
                  )}
                >
                  Default
                </button>
                <button 
                  onClick={() => setAdvancedMode(true)}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                    advancedMode ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"
                  )}
                >
                  Advanced
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Mode Section */}
      <AnimatePresence>
        {advancedMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card className="border-2 border-primary/20 shadow-xl overflow-hidden bg-card">
              <CardHeader className="bg-primary text-primary-foreground pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Code size={20} />
                    </div>
                    <div>
                      <CardTitle>Developer Console</CardTitle>
                      <CardDescription className="text-primary-foreground/70">Inject custom HTML/JS features</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-400 text-yellow-900 border-none">
                    <Zap size={12} className="mr-1 fill-current" /> ADVANCED MODE ACTIVE
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold flex items-center gap-2">
                    <Monitor size={14} /> Custom Feature Code
                  </Label>
                  <textarea 
                    value={localHtml}
                    onChange={(e) => setLocalHtml(e.target.value)}
                    className="w-full min-h-[300px] p-6 bg-slate-900 text-green-400 font-mono text-sm rounded-xl border-none focus:ring-2 focus:ring-primary shadow-inner leading-relaxed"
                    spellCheck={false}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setLocalHtml('')}>Reset</Button>
                  <Button className="bg-green-600 hover:bg-green-700 shadow-lg px-8" onClick={deployCode}>
                    Deploy Feature
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
