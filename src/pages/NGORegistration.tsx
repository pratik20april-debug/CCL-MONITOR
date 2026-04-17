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

export default function NGORegistration() {
  const [step, setStep] = React.useState(1);
  const [invitationCode, setInvitationCode] = React.useState('');
  const [ngoName, setNgoName] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [invitationData, setInvitationData] = React.useState<any>(null);
  const [otpSent, setOtpSent] = React.useState(false);
  const [mockOtp, setMockOtp] = React.useState('');

  // Check URL for code on mount
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) setInvitationCode(code);
  }, []);

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

  const sendOtp = () => {
    if (mobile.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setMockOtp(generatedOtp);
    setOtpSent(true);
    toast.success(`Verification code sent to ${mobile}. (Demo OTP: ${generatedOtp})`);
  };

  const verifyOtp = () => {
    if (otp === mockOtp) {
      setStep(3);
      toast.success('Mobile number verified.');
    } else {
      toast.error('Invalid OTP. Please try again.');
    }
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setIsVerifying(true);
    try {
      // Create auth user (using a dummy email format for NGO login logic)
      const dummyEmail = `ngo_${mobile}@ccl.csr`;
      const userCredential = await createUserWithEmailAndPassword(auth, dummyEmail, password);
      
      // Update Auth Profile
      await updateProfile(userCredential.user, { displayName: ngoName });

      // Create User Profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: dummyEmail,
        name: ngoName,
        mobile: mobile,
        role: 'NGO',
        createdAt: Date.now()
      });

      // Create NGO specific record
      const ngoRef = await addDoc(collection(db, 'ngos'), {
        name: ngoName,
        mobile: mobile,
        status: 'ACTIVE',
        approvalStatus: 'PENDING', // Still needs admin approval for full access
        createdAt: Date.now(),
        invitationId: invitationData.id,
        invitationCode: invitationCode
      });

      // Mark invitation as USED
      await updateDoc(doc(db, 'invitations', invitationData.id), {
        status: 'USED',
        usedBy: ngoRef.id
      });

      toast.success('Registration complete! Welcome to the CCL CSR Portal.');
      window.location.href = '/'; // Go home/login
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
              {step === 1 && (
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
                  <Button onClick={verifyInvitation} disabled={isVerifying} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]">
                    Verify Invitation {isVerifying && "..."}
                  </Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
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
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input 
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          className="h-12 pl-12 rounded-xl border-slate-200"
                          placeholder="Registered Mobile No."
                        />
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      </div>
                      <Button variant="outline" onClick={sendOtp} disabled={otpSent} className="h-12 rounded-xl px-6 font-bold text-xs uppercase">
                        {otpSent ? "Resend" : "Send OTP"}
                      </Button>
                    </div>
                  </div>
                  {otpSent && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Enter OTP</Label>
                      <div className="relative">
                        <Input 
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="h-12 pl-12 rounded-xl border-slate-200 tracking-[0.8em] font-black text-center"
                          placeholder="000000"
                        />
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      </div>
                      <Button onClick={verifyOtp} className="w-full h-12 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-xs mt-2">
                        Verify Number
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {step === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Create Password</Label>
                    <div className="relative">
                      <Input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 pl-12 rounded-xl border-slate-200"
                        placeholder="••••••••"
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
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-12 pl-12 rounded-xl border-slate-200"
                        placeholder="••••••••"
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
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
