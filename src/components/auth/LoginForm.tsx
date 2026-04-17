import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { toast } from 'sonner';
import { auth } from '@/src/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const schema = z.object({
  email: z.string().min(3, "Required"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export default function LoginForm({ isNGO = false }: { isNGO?: boolean }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data: any) => {
    try {
      let email = data.email;
      // If it looks like a mobile number and it's NGO login, convert to pseudo-email
      if (isNGO && /^\d{10}$/.test(email)) {
        email = `ngo_${email}@ccl.csr`;
      }
      await signInWithEmailAndPassword(auth, email, data.password);
      toast.success("Login successful!");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Invalid credentials");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">{isNGO ? "Registered Mobile or Email" : "Email ID"}</Label>
        <Input 
          id="login-email" 
          type={isNGO ? "text" : "email"} 
          {...register('email')} 
          placeholder={isNGO ? "9988776655" : "john@example.com"} 
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message as string}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <Input id="login-password" type="password" {...register('password')} placeholder="••••••••" />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message as string}</p>}
      </div>
      
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Login"}
      </Button>
      
      <div className="text-center">
        <Button variant="link" size="sm" type="button">Forgot password?</Button>
      </div>
    </form>
  );
}
