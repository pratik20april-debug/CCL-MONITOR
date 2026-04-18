import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { toast } from 'sonner';
import { auth, db } from '@/src/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

const employeeSchema = z.object({
  email: z.string().email("Invalid email").min(3, "Required"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

const ngoSchema = z.object({
  mobile: z.string().length(10, "10-digit mobile required"),
  uniqueId: z.string().min(5, "Unique ID is required"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

function NGOLoginForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(ngoSchema)
  });

  const onSubmit = async (data: any) => {
    try {
      // Search for user by Mobile and Unique ID
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef, 
        where('role', '==', 'NGO'),
        where('mobile', '==', data.mobile.trim()),
        where('uniqueId', '==', data.uniqueId.trim())
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        toast.error("Invalid Mobile No. or Unique ID association.");
        return;
      }

      const userData = snapshot.docs[0].data();
      
      await signInWithEmailAndPassword(auth, userData.email, data.password);
      toast.success("Login successful!");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Invalid credentials");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mobile">Mobile Number</Label>
        <Input 
          id="mobile" 
          type="text" 
          {...register('mobile')} 
          placeholder="Registered Mobile Number" 
        />
        {errors.mobile && <p className="text-xs text-destructive">{errors.mobile.message as string}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="unique-id">Unique Login Code</Label>
        <Input 
          id="unique-id" 
          type="text" 
          {...register('uniqueId')} 
          placeholder="NGO-XXXX-XXX" 
          className="font-mono uppercase"
        />
        {errors.uniqueId && <p className="text-xs text-destructive">{errors.uniqueId.message as string}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <Input id="login-password" type="password" {...register('password')} placeholder="••••••••" />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message as string}</p>}
      </div>
      
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Authenticating..." : "NGO Login"}
      </Button>
    </form>
  );
}

function EmployeeLoginForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(employeeSchema)
  });

  const onSubmit = async (data: any) => {
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast.success("Login successful!");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Invalid credentials");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">Employee Email ID</Label>
        <Input 
          id="login-email" 
          type="email" 
          {...register('email')} 
          placeholder="employee@ccl.gov.in" 
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message as string}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <Input id="login-password" type="password" {...register('password')} placeholder="••••••••" />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message as string}</p>}
      </div>
      
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Employee Login"}
      </Button>
    </form>
  );
}

export default function LoginForm({ isNGO = false }: { isNGO?: boolean }) {
  return (
    <div className="space-y-4">
      {isNGO ? <NGOLoginForm /> : <EmployeeLoginForm />}
      
      <div className="text-center">
        <Button variant="link" size="sm" type="button">
          {isNGO ? "Trouble logging in?" : "Forgot password?"}
        </Button>
      </div>
    </div>
  );
}
