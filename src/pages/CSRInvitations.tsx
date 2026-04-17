import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Mail, Copy, Link as LinkIcon, Trash2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/firebase';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export default function CSRInvitations() {
  const [invitations, setInvitations] = React.useState<any[]>([]);
  const [targetNGO, setTargetNGO] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);

  React.useEffect(() => {
    const q = query(collection(db, 'invitations'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setInvitations(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const generateInvitation = async () => {
    if (!targetNGO.trim()) {
      toast.error('Please specify the NGO name for the invitation.');
      return;
    }

    setIsGenerating(true);
    try {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      await addDoc(collection(db, 'invitations'), {
        code,
        targetNGO: targetNGO.trim(),
        createdAt: Date.now(),
        status: 'PENDING',
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      });
      setTargetNGO('');
      toast.success('Special invitation code generated successfully.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate invitation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyLink = (code: string) => {
    const link = `${window.location.origin}/register-ngo?code=${code}`;
    navigator.clipboard.writeText(link);
    toast.success('Invitation link copied to clipboard.');
  };

  const deleteInvitation = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'invitations', id));
      toast.success('Invitation revoked.');
    } catch (error) {
      toast.error('Failed to revoke invitation.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Special Invitations</h2>
          <p className="text-slate-500 font-medium">Generate and manage exclusive onboarding links for NGO partners</p>
        </div>
      </div>

      <Card className="border-none shadow-2xl bg-primary text-primary-foreground overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles size={20} /> Generate New Link
          </CardTitle>
          <CardDescription className="text-primary-foreground/70 italic text-xs">
            These links are valid for 7 days and can be used once for registration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="ngoName" className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/60">Target NGO Name</Label>
              <Input 
                id="ngoName"
                placeholder="Enter official NGO name..." 
                value={targetNGO}
                onChange={(e) => setTargetNGO(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 rounded-xl focus:ring-white/20"
              />
            </div>
            <Button 
              onClick={generateInvitation}
              disabled={isGenerating}
              className="bg-white text-primary hover:bg-white/90 font-black uppercase tracking-widest rounded-xl px-12 h-12 self-end shadow-xl shadow-black/10"
            >
              Generate Code
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode='popLayout'>
          {invitations.map((inv) => (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              layout
            >
              <Card className="border-none shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden">
                <div className={cn(
                  "absolute top-0 left-0 w-1 h-full",
                  inv.status === 'PENDING' ? "bg-yellow-400" : "bg-green-500"
                )} />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-black truncate max-w-[150px]">{inv.targetNGO}</CardTitle>
                    <div className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                      inv.status === 'PENDING' ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                    )}>
                      {inv.status}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between group-hover:bg-slate-100 transition-colors">
                    <code className="text-xs font-mono font-bold text-slate-600">{inv.code}</code>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => copyLink(inv.code)}>
                        <Copy size={14} />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                    <span>Generated: {new Date(inv.createdAt).toLocaleDateString()}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => deleteInvitation(inv.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {invitations.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300">
            <LinkIcon size={48} className="mb-4 opacity-20" />
            <p className="font-black uppercase tracking-[0.2em] text-xs">No invitations active</p>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
