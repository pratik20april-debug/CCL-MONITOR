import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { ShieldCheck, User, KeyRound, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import CCLRegistrationForm from './CCLRegistrationForm';
import LoginForm from './LoginForm';

export default function AuthTabs({ onSuperAdminLogin }: { onSuperAdminLogin: (code: string) => void }) {
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
    <div className="w-full max-w-md mx-auto">
      <Tabs defaultValue="employee" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 h-14 p-1 bg-muted/50 rounded-2xl">
          <TabsTrigger 
            value="employee" 
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2"
          >
            <User size={16} />
            Employee
          </TabsTrigger>
          <TabsTrigger 
            value="ngo" 
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2"
          >
            <Building2 size={16} />
            NGO
          </TabsTrigger>
          <TabsTrigger 
            value="admin" 
            className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2"
          >
            <ShieldCheck size={16} />
            Super Admin
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="employee">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-transparent">
              <TabsTrigger value="login" className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none bg-transparent shadow-none">Login</TabsTrigger>
              <TabsTrigger value="register" className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none bg-transparent shadow-none">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-xl">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-black tracking-tight">Employee Login</CardTitle>
                  <CardDescription>
                    Enter your credentials to access the CSR portal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LoginForm />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-xl">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-black tracking-tight">Employee Registration</CardTitle>
                  <CardDescription>
                    Register as a Central Coalfields Limited employee
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CCLRegistrationForm />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="ngo">
          <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-black tracking-tight">NGO Partner Login</CardTitle>
              <CardDescription>
                Access your designated dashboard and project tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm isNGO />
              <div className="mt-6 pt-6 border-t border-border/50 text-center">
                <p className="text-xs text-muted-foreground">
                  NGO registration is strictly by invitation link only.
                </p>
                <p className="text-[10px] mt-2 font-bold uppercase text-primary/60">
                  Contact CSR Department for access links
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="admin">
          <Card className="border-2 border-primary/20 shadow-2xl bg-card/50 backdrop-blur-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <CardHeader className="space-y-1 relative">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-2">
                <KeyRound size={24} />
              </div>
              <CardTitle className="text-2xl font-black tracking-tight">Super Admin Access</CardTitle>
              <CardDescription>
                Enter the special authorization code for direct system access
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-code">Authorization Code</Label>
                  <Input 
                    id="admin-code" 
                    type="password" 
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    placeholder="Enter special code" 
                    className="h-12 text-center font-mono tracking-[0.5em] text-lg"
                  />
                </div>
                <Button type="submit" className="w-full h-12 font-bold text-sm uppercase tracking-widest">
                  Verify & Login
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
