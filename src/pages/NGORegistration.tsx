import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Building2, Phone, Key, ShieldCheck, ArrowRight, Sparkles, AlertCircle, Link as LinkIcon, Lock } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db, auth } from '@/src/firebase';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/src/lib/utils';

export default function NGORegistration() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = React.useState(1);
  const [invitationCode, setInvitationCode] = React.useState('');
  const [ngoName, setNgoName] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [uniqueLoginCode, setUniqueLoginCode] = React.useState('');
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [invitationData, setInvitationData] = React.useState<any>(null);
  const [isActivated, setIsActivated] = React.useState(false);

  // Check URL for code on mount - Robust Extraction
  React.useEffect(() => {
    // Check both searchParams and raw hash/search as fallback
    const codeFromParams = searchParams.get('code');
    const codeFromURL = new URLSearchParams(window.location.search).get('code') || 
                        new URLSearchParams(window.location.hash.split('?')[1]).get('code');
    
    const code = codeFromParams || codeFromURL;
    
    if (code) {
      setInvitationCode(code);
      const verifyAuto = async () => {
        setIsVerifying(true);
        try {
          const q = query(collection(db, 'invitations'), where('code', '==', code.trim()), where('status', '==', 'PENDING'));
          const snapshot = await getDocs(q);

          if (snapshot.empty) {
            toast.error('Invalid or expired invitation code.');
            return;
          }

          const data = { id: snapshot.docs[0].id, ...(snapshot.docs[0].data() as any) };
          setInvitationData(data);
          setNgoName(data.targetNGO || '');
          setStep(2);
          toast.success('Invitation link detected and verified.');
        } catch (error) {
          console.error("Auto-verify error:", error);
          toast.error('Verification failed. Please enter code manually.');
        } finally {
          setIsVerifying(false);
        }
      };
      verifyAuto();
    }
  }, [searchParams]);

  const verifyInvitation = async () => {
    if (!invitationCode.trim()) {
      toast.error('Please enter a valid invitation code.');
      return;
    }

    setIsVerifying(true);
    try {
      const q = query(collection(db, 'invitations'), where('code', '==', invitationCode.trim()), where('status', '==', 'PENDING'));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast.error('Invalid or expired invitation code.');
        return;
      }

      const data = { id: snapshot.docs[0].id, ...(snapshot.docs[0].data() as any) };
      setInvitationData(data);
      setNgoName(data.targetNGO || '');
      setStep(2);
      toast.success('Invitation verified successfully.');
    } catch (error) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const generateUniqueId = () => {
    if (mobile.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }
    
    setIsVerifying(true);
    // Generate unique login ID for NGO associated with mobile
    const suffix = mobile.slice(-4);
    const rand = Math.floor(100 + Math.random() * 900);
    const uniqueId = `NGO-${suffix}-${rand}`;
    setUniqueLoginCode(uniqueId);
    
    setStep(3);
    setIsVerifying(false);
    toast.success('Unique ID generated successfully! Please set your password.');
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (password.length !== 6) {
      toast.error('Password must be exactly 6 digits.');
      return;
    }

    // Verify NGO name matches invitation (matchable ignore lower or upper case)
    if (!invitationData || !invitationData.targetNGO) {
      toast.error('Session expired. Please re-verify your invitation code.');
      setStep(1);
      return;
    }

    if (ngoName.trim().toLowerCase() !== invitationData.targetNGO.trim().toLowerCase()) {
      toast.error(`NGO Name must match the invitation name: ${invitationData.targetNGO}`);
      return;
    }

    setIsVerifying(true);
    try {
      // Create auth user (using a dummy email format for NGO login logic)
      const dummyEmail = `ngo_${uniqueLoginCode.toLowerCase()}@ccl.csr`;
      const userCredential = await createUserWithEmailAndPassword(auth, dummyEmail, password);
      
      // Update Auth Profile
      await updateProfile(userCredential.user, { displayName: ngoName });

      // Create User Profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: dummyEmail,
        name: ngoName,
        mobile: mobile,
        uniqueId: uniqueLoginCode,
        role: 'NGO',
        createdAt: Date.now()
      });

      // Create NGO specific record
      const ngoRef = await addDoc(collection(db, 'ngos'), {
        name: ngoName,
        uniqueId: uniqueLoginCode,
        mobile: mobile,
        status: 'ACTIVE',
        approvalStatus: 'PENDING',
        createdAt: Date.now(),
        invitationId: invitationData.id,
        invitationCode: invitationCode
      });

      // Mark invitation as USED
      await updateDoc(doc(db, 'invitations', invitationData.id), {
        status: 'USED',
        usedBy: ngoRef.id,
        usedAt: Date.now()
      });

      setIsActivated(true);
      toast.success(`Account Activated! Your official Unique Code is: ${uniqueLoginCode}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Registration failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 tech-grid">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-4">
            <Sparkles size={16} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Exclusive Onboarding</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">NGO Registration</h1>
          <p className="text-slate-500 font-medium">Connect with CCL CSR missions across Jharkhand</p>
        </div>

        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          <CardHeader className="pb-2">
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3].map((s) => (
                <div 
                  key={s} 
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500",
                    step >= s ? "bg-primary w-8" : "bg-slate-200 w-4"
                  )} 
                />
              ))}
            </div>
            <CardTitle className="text-xl font-black text-center uppercase tracking-tight">
              {step === 1 && "Redeem Invitation"}
              {step === 2 && "Verification"}
              {step === 3 && "Secure Account"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <AnimatePresence mode="wait">
              {isActivated ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-8">
                  <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-200">
                    <ShieldCheck size={48} className="text-white" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">ACCOUNT ACTIVATED</h2>
                    <p className="text-slate-500 font-medium italic">Welcome to the CCL CSR Ecosystem</p>
                  </div>
                  
                  <div className="p-6 rounded-[2rem] bg-primary/5 border-2 border-dashed border-primary/20 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Your Secure Unique Code</p>
                    <div className="text-4xl font-black font-mono tracking-tighter text-primary">
                      {uniqueLoginCode}
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed px-4">
                      KINDLY SAVE THIS CODE. YOU WILL NEED IT ALONG WITH YOUR MOBILE NO. AND PASSWORD TO ACCESS YOUR DASHBOARD.
                    </p>
                  </div>

                  <Button 
                    onClick={() => navigate('/login')} 
                    className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:scale-[1.02] transition-transform"
                  >
                    Enter Login Panel
                  </Button>
                </motion.div>
              ) : step === 1 ? (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invitation Code</Label>
                    <div className="relative">
                      <Input 
                        placeholder="Enter 8-digit code..." 
                        value={invitationCode}
                        onChange={(e) => setInvitationCode(e.target.value)}
                        className="h-14 font-mono text-center tracking-[0.5em] text-lg uppercase rounded-2xl border-slate-200 focus:ring-primary/20"
                      />
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    </div>
                  </div>
                  <Button 
                    onClick={verifyInvitation} 
                    disabled={isVerifying} 
                    className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
                  >
                    Verify Invitation {isVerifying && "..."}
                  </Button>
                </motion.div>
              ) : step === 2 ? (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">NGO Official Name</Label>
                    <div className="relative">
                      <Input 
                        value={ngoName}
                        onChange={(e) => setNgoName(e.target.value)}
                        className="h-12 pl-12 rounded-xl border-slate-200"
                        placeholder="Organization Name"
                      />
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mobile Number</Label>
                    <div className="relative">
                      <Input 
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="h-12 pl-12 rounded-xl border-slate-200"
                        placeholder="Registered Mobile No."
                      />
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    </div>
                  </div>
                  <Button 
                    onClick={generateUniqueId} 
                    disabled={mobile.length !== 10 || isVerifying}
                    className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
                  >
                    Generate Unique ID & Continue {isVerifying && "..."}
                  </Button>
                </motion.div>
              ) : (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Create Password (6 Digits)</Label>
                    <div className="relative">
                      <Input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="h-12 pl-12 rounded-xl border-slate-200"
                        placeholder="••••••"
                        maxLength={6}
                      />
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirm Password</Label>
                    <div className="relative">
                      <Input 
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="h-12 pl-12 rounded-xl border-slate-200"
                        placeholder="••••••"
                        maxLength={6}
                      />
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    </div>
                  </div>
                  <Button onClick={handleRegister} disabled={isVerifying} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm bg-primary text-white shadow-xl shadow-primary/20">
                    Complete Registration {isVerifying && "..."}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
          <CardFooter className="bg-slate-50 flex justify-between px-8 py-4 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CCL CSR Onboarding System</span>
            <div className="flex items-center gap-1.5 opacity-50">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
              <span className="text-[10px] font-black">{step}/3 Secure</span>
            </div>
          </CardFooter>
        </Card>
        
        <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <Button 
            variant="ghost" 
            className="text-slate-400 font-bold hover:text-primary transition-colors gap-2"
            onClick={() => navigate('/login')}
          >
            Already have an account? Return to Login
          </Button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return null; // This file is a page, this might be a mistake in the template if it existed
}
