'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Loader2, ArrowRight, ShieldCheck, Phone, KeyRound, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleLogo } from '@/components/icons/GoogleLogo';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, logout, googleLogin } = useAuth(); // logout ফাংশনটা নিশ্চিত করুন হুকে আছে
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // ১. ফোন নম্বর দিয়ে OTP পাঠানো
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // আমরা ইউজারদের সেইম API ব্যবহার করছি, কারণ অ্যাডমিনও একজন ইউজার
      const res = await fetch('/api/auth/phone/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (data.success) {
        setStep('otp');
        toast.success('OTP sent to admin mobile');
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error('Connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  // ২. OTP ভেরিফাই এবং রোল চেক (Main Security Logic)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();

      if (data.success) {
        // ★★★ গেটকিপার লজিক (Role Check) ★★★
        if (data.user.role === 'admin' || data.user.role === 'super-admin') {
          // অ্যাডমিন কনফার্ম - লগইন করাও
          login(data.user, data.token);
          toast.success('Welcome back, Admin!');
          router.push('/admin'); // ড্যাশবোর্ডে পাঠাও
        } else {
          // অ্যাডমিন না - বের করে দাও
          toast.error('Access Denied: You are not an Admin!');
          // সেফটির জন্য লগআউট বা টোকেন ক্লিয়ার করে দেওয়া ভালো
          if (logout) logout(); 
        }
      } else {
        toast.error(data.error || 'Invalid OTP');
      }
    } catch (error) {
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // ৩. গুগল লগইন এবং রোল চেক
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const result = await googleLogin(); // googleLogin যেন user অবজেক্ট রিটার্ন করে সেটা দেখতে হবে
    
    if (result.success) {
      // ★★★ গেটকিপার লজিক ★★★
      if (result.user.role === 'admin' || result.user.role === 'super-admin') {
         toast.success('Admin access granted');
         router.push('/admin');
      } else {
         toast.error('Access Denied: Not an Admin account!');
         // গুগল দিয়ে লগইন হয়ে গেছে কিন্তু সে অ্যাডমিন না, তাই লগআউট করে দাও
         if (logout) logout();
         // অথবা হোমপেজে পাঠিয়ে দাও
         // router.push('/'); 
      }
    } else {
      toast.error(result.error || 'Google login failed');
    }
    setIsGoogleLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        
        {/* Admin Header */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
            <ShieldCheck className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Admin Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Secure access for management only
          </p>
        </div>

        <div className="mt-8 space-y-6">
          
          {/* Step 1: Phone Input */}
          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-5 animate-in fade-in slide-in-from-left-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-900">Admin Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter registered admin number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12 pl-10 border-gray-200 focus:border-red-500 focus:ring-red-500"
                  />
                </div>
              </div>

              <Button type="submit" className="group h-12 w-full bg-red-600 text-white hover:bg-red-700 font-medium" disabled={isLoading || isGoogleLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <span className="flex items-center justify-center gap-2">Get Admin OTP <ArrowRight className="h-4 w-4" /></span>}
              </Button>
            </form>
          )}

          {/* Step 2: OTP Input */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm font-medium text-gray-900">Enter Security Code</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="otp"
                    placeholder="6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12 pl-10 text-center font-bold tracking-widest border-gray-200 focus:border-red-500 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep('phone')} disabled={isLoading} className="h-12 w-1/3">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button type="submit" className="h-12 w-2/3 bg-red-600 text-white hover:bg-red-700 font-medium" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <span className="flex items-center gap-2"><Lock className="h-4 w-4"/> Verify Access</span>}
                </Button>
              </div>
            </form>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider"><span className="bg-white px-3 text-gray-500">Or admin login with</span></div>
          </div>

          <Button 
            variant="outline" 
            type="button" 
            className="h-12 w-full gap-3 border-gray-200 bg-white text-[15px] font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900" 
            onClick={handleGoogleSignIn} 
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleLogo className="h-5 w-5" />}
            Google Admin Account
          </Button>

        </div>
      </div>
    </div>
  );
}
