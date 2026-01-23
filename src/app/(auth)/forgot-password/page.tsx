// src/app/(auth)/forgot-password/page.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Mail, Lock, KeyRound, Eye, EyeOff, ChefHat } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // নম্বর ইনপুট লজিক
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
        setOtp(value);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        setStep('otp');
      } else {
        toast.error(data.error || "Failed to send OTP");
      }
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
    }
    if (newPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Password reset successfully! Please login.");
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

  return (
    // MAIN CONTAINER: Split Screen Layout
    <div className="fixed inset-0 z-[100] grid h-screen w-full grid-cols-1 overflow-hidden bg-white lg:grid-cols-2">
      
      {/* LEFT SIDE: Form Container */}
      <div className="flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-20 xl:px-28 overflow-y-auto">
        
        <div className="mx-auto w-full max-w-sm space-y-8 py-8">
          
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {step === 'email' ? 'Forgot Password?' : 'Reset Password'}
            </h1>
            <p className="text-base text-gray-500">
              {step === 'email' 
                ? "Don't worry, it happens. Enter your email to recover your account." 
                : `Enter the OTP sent to ${email} and set your new password.`}
            </p>
          </div>
          
          <div className="space-y-6">
            {step === 'email' ? (
                // STEP 1: Email Form
                <form onSubmit={handleSendOtp} className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-900">Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                                id="email" 
                                type="email" 
                                placeholder="name@example.com" 
                                className="h-12 pl-10 border-gray-200 focus:border-primary focus:ring-primary"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    <Button type="submit" className="h-12 w-full bg-primary text-white hover:bg-primary/90 font-medium shadow-lg shadow-primary/20" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Send OTP Code
                    </Button>
                </form>
            ) : (
                // STEP 2: Reset Form
                <form onSubmit={handleResetPassword} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-2">
                        <Label htmlFor="otp" className="text-sm font-medium text-gray-900">OTP Code</Label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                                id="otp" 
                                type="text" 
                                placeholder="Enter 6-digit OTP" 
                                className="h-12 pl-10 border-gray-200 focus:border-primary focus:ring-primary"
                                value={otp}
                                onChange={handleOtpChange}
                                inputMode="numeric"
                                maxLength={6}
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="newPassword" className="text-sm font-medium text-gray-900">New Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                                id="newPassword"
                                type={showNewPassword ? "text" : "password"} 
                                placeholder="Create new password" 
                                className="h-12 pl-10 pr-10 border-gray-200 focus:border-primary focus:ring-primary"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900"
                            >
                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-900">Confirm Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm new password" 
                                className="h-12 pl-10 pr-10 border-gray-200 focus:border-primary focus:ring-primary"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={isLoading}
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
                        Reset Password
                    </Button>
                    
                    <div className="text-center pt-2">
                        <button 
                            type="button"
                            onClick={() => setStep('email')}
                            className="text-xs font-semibold text-primary hover:underline"
                            disabled={isLoading}
                        >
                            Change Email Address
                        </button>
                    </div>
                </form>
            )}

            <div className="relative py-2">
               <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div>
            </div>

            <div className="text-center">
                <Link href="/login" className="inline-flex items-center justify-center text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                </Link>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Visual Experience */}
      <div className="relative hidden h-full flex-col bg-gray-900 p-10 text-white lg:flex">
        <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ 
                // Using a 'Dessert/Comfort' image for Forgot Password page
                backgroundImage: `url('https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1989&auto=format&fit=crop')` 
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
              &ldquo;We all forget things sometimes. But don't worry, we'll get you back to your favorite meals in no time.&rdquo;
            </p>
          </blockquote>
        </div>
      </div>
    </div>
  );
}