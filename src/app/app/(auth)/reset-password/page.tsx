// src/app/(auth)/reset-password/page.tsx

'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, Lock, ChefHat, ArrowLeft, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Toggle states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
    }
    if (newPassword.length < 6) {
        toast.error("Password must be at least 6 characters long");
        return;
    }
    if (!token) {
        toast.error("Invalid or missing token");
        return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Password reset successfully!");
        router.push('/login');
      } else {
        toast.error(data.error || "Failed to reset password");
      }
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  // If no token is present, show a nice error state
  if (!token) {
      return (
        <div className="flex h-full flex-col items-center justify-center text-center space-y-4 px-8">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-2">
                <Lock className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Invalid Link</h2>
            <p className="text-gray-500 max-w-xs">
                The password reset link is invalid or has expired. Please try requesting a new one.
            </p>
            <Button asChild variant="outline" className="mt-4">
                <Link href="/forgot-password">Request New Link</Link>
            </Button>
        </div>
      )
  }

  return (
    <div className="flex h-full w-full flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-20 xl:px-28 overflow-y-auto">
        <div className="mx-auto w-full max-w-sm space-y-8 py-8">
            
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    Reset Password
                </h1>
                <p className="text-base text-gray-500">
                    Create a strong new password for your account to stay secure.
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                            id="newPassword"
                            type={showPassword ? "text" : "password"} 
                            className="h-12 pl-10 pr-10 border-gray-200 focus:border-primary focus:ring-primary"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"} 
                            className="h-12 pl-10 pr-10 border-gray-200 focus:border-primary focus:ring-primary"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                         <button 
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900"
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <Button type="submit" className="h-12 w-full bg-primary text-white hover:bg-primary/90 font-medium shadow-lg shadow-primary/20" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Update Password
                </Button>
            </form>

            <div className="text-center pt-2">
                <Link href="/login" className="inline-flex items-center justify-center text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                </Link>
            </div>
        </div>
    </div>
  );
}

export default function ResetPasswordPage() {
    return (
      // MAIN CONTAINER: Split Screen Layout
      <div className="fixed inset-0 z-[100] grid h-screen w-full grid-cols-1 overflow-hidden bg-white lg:grid-cols-2">
        
        {/* LEFT SIDE: Form (Wrapped in Suspense) */}
        <Suspense fallback={
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>

        {/* RIGHT SIDE: Visual Experience */}
        <div className="relative hidden h-full flex-col bg-gray-900 p-10 text-white lg:flex">
          <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ 
                  // Image: Fresh Spices/Ingredients (Symbolizing a fresh start/reset)
                  backgroundImage: `url('https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=2070&auto=format&fit=crop')` 
              }}
          >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
          </div>

          <div className="relative z-10 flex items-center gap-2 text-xl font-bold tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-lg">
              <ChefHat className="h-5 w-5" />
            </div>
            Bumbas Kitchen
          </div>

          <div className="relative z-10 mt-auto max-w-md">
            <blockquote className="space-y-2 border-l-2 border-primary pl-6">
              <p className="text-lg font-medium leading-relaxed text-white">
                &ldquo;Security is our priority. Reset your password and get back to enjoying your favorite meals safely.&rdquo;
              </p>
            </blockquote>
          </div>
        </div>
      </div>
    );
}