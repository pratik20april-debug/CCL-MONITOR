import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { RefreshCw } from 'lucide-react';
import { CCL_UNIQUE_CODE } from '@/src/constants';
import { toast } from 'sonner';
import { auth, db } from '@/src/firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  dob: z.string().min(1, "Date of birth is required"),
  uniqueCode: z.string().refine((val) => val === CCL_UNIQUE_CODE, {
    message: "Invalid unique code for CCL employees"
  }),
  captcha: z.string().min(1, "Captcha is required")
});

export default function CCLRegistrationForm() {
  const [captchaText, setCaptchaText] = React.useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(schema)
  });

  const generateCaptcha = () => {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
  };

  React.useEffect(() => {
    generateCaptcha();
  }, []);

  const onSubmit = async (data: any) => {
    if (data.captcha !== captchaText) {
      toast.error("Invalid captcha code");
      return;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: data.email,
        name: data.name,
        dob: data.dob,
        uniqueCode: data.uniqueCode,
        role: 'CCL_EMPLOYEE',
        createdAt: Date.now()
      });

      await signOut(auth);
      toast.success("Registration successful! Please login with your credentials.");
      reset();
      generateCaptcha();
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Registration failed");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" {...register('name')} placeholder="John Doe" className="h-12 rounded-xl" />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message as string}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email ID</Label>
        <Input id="email" type="email" {...register('email')} placeholder="john@ccl.gov.in" className="h-12 rounded-xl" />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message as string}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" {...register('password')} placeholder="••••••••" className="h-12 rounded-xl" />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message as string}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="dob">Date of Birth</Label>
        <Input id="dob" type="date" {...register('dob')} className="h-12 rounded-xl" />
        {errors.dob && <p className="text-xs text-destructive">{errors.dob.message as string}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="uniqueCode">Unique Code</Label>
        <Input id="uniqueCode" {...register('uniqueCode')} placeholder="Enter 9-digit code" className="h-12 rounded-xl" />
        {errors.uniqueCode && <p className="text-xs text-destructive">{errors.uniqueCode.message as string}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="captcha">Captcha</Label>
        <div className="flex gap-4 items-center">
          <div className="bg-slate-50 px-5 py-3 rounded-2xl font-mono text-2xl tracking-[0.4em] select-none text-slate-900 italic border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-50" />
            <span className="relative z-10">{captchaText}</span>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            size="icon" 
            onClick={generateCaptcha} 
            className="h-14 w-14 rounded-2xl border-slate-200 bg-white text-slate-400 hover:text-primary hover:border-primary/50 transition-all shadow-sm"
          >
            <RefreshCw size={18} />
          </Button>
        </div>
        <Input id="captcha" {...register('captcha')} placeholder="Enter captcha above" className="h-12 rounded-xl" />
        {errors.captcha && <p className="text-xs text-destructive">{errors.captcha.message as string}</p>}
      </div>
      
      <Button type="submit" className="w-full h-14 font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/10 transition-all" disabled={isSubmitting}>
        {isSubmitting ? "Registering..." : "Execute Registration"}
      </Button>
    </form>
  );
}
