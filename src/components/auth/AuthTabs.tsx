import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { ShieldCheck, User, KeyRound, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import CCLRegistrationForm from './CCLRegistrationForm';
import LoginForm from './LoginForm';

export default function AuthTabs({ onSuperAdminLogin, initialTab = 'employee' }: { 
  onSuperAdminLogin: (code: string) => void;
  initialTab?: 'employee' | 'ngo' | 'admin';
}) {
  const navigate = useNavigate();
  const [adminCode, setAdminCode] = React.useState('');
  const SUPER_ADMIN_CODE = "G56AW0912PL";

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCode === SUPER_ADMIN_CODE) {
      onSuperAdminLogin(adminCode);
      toast.success("Super Admin access granted!");
    } else {
      toast.error("Invalid Super Admin access code");
    }
  };

  return (
    <div className="w-full">
      <Tabs defaultValue={initialTab} value={initialTab} className="w-full">
        {/* We hide the TabsList as navigation is handled by the parent LoginPage persona selection */}
        <TabsList className="hidden">
          <TabsTrigger value="employee">Employee</TabsTrigger>
          <TabsTrigger value="ngo">NGO</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>
        
        <TabsContent value="employee" className="mt-0 outline-none">
          <Tabs defaultValue="login" className="w-full">
            <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
              <TabsList className="grid w-full grid-cols-2 bg-transparent h-12">
                <TabsTrigger 
                  value="login" 
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all"
                >
                  Register
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="login" className="mt-0 outline-none">
              <div className="space-y-6">
                <LoginForm />
              </div>
            </TabsContent>
            
            <TabsContent value="register" className="mt-0 outline-none">
              <div className="space-y-6">
                <CCLRegistrationForm />
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="ngo" className="mt-0 outline-none">
          <div className="space-y-8">
            <LoginForm isNGO />
            <div className="pt-8 border-t border-slate-100 text-center space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                <p className="text-[10px] text-emerald-800 font-bold leading-relaxed uppercase tracking-widest">
                  NGO registration is strictly by <span className="text-emerald-600">invitation link only</span>.
                </p>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/register-ngo')} 
                className="text-[10px] font-black uppercase tracking-[0.2em] h-14 w-full rounded-2xl border-slate-200 bg-white text-slate-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all"
              >
                Redeem Invitation Code
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="admin" className="mt-0 outline-none">
          <div className="space-y-8 relative">
            <form onSubmit={handleAdminSubmit} className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="admin-code" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Authorization Code</Label>
                <Input 
                  id="admin-code" 
                  type="password" 
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  placeholder="••••••••" 
                  className="h-20 bg-slate-50 border-slate-200 text-slate-900 rounded-2xl text-center font-mono tracking-[1em] text-2xl focus:border-primary/50 transition-all placeholder:text-slate-200"
                />
              </div>
              <Button type="submit" className="w-full h-16 font-black text-xs uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-slate-200">
                Verify Identity
              </Button>
            </form>
            <div className="text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                Unauthorized access attempts are monitored for security compliance.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
