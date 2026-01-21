// src/app/(auth)/login/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, Smartphone, Mail, Send, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleLogo } from '@/components/icons/GoogleLogo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Capacitor } from '@capacitor/core';

export default function LoginPage() {
  const router = useRouter();
  const { login, googleLogin } = useAuth();
  
  // States
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false); 

  // ★★★ PHONE LOGIN LOGIC (SMS Intent Method) ★★★
  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ফোন নম্বর ভ্যালিডেশন
    if (!phone || phone.length < 10) {
        toast.error("Please enter a valid phone number");
        return;
    }

    setIsLoading(true);

    try {
      // ১. OTP রিকোয়েস্ট (Backend এ)
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      
      if (!data.success) throw new Error(data.error || "Failed to start login");

      // ২. SMS লিঙ্ক তৈরি (Crash-Free Method)
      // এটি সরাসরি মেসেজ অ্যাপ ওপেন করবে প্রি-ফিল্ড টেক্সট সহ
      const messageBody = `VERIFY-${data.otpCode}`;
      const adminPhone = data.targetPhone; // e.g. +9191240680234
      
      // Android/iOS SMS Scheme
      const smsLink = `sms:${adminPhone}?body=${encodeURIComponent(messageBody)}`;
      
      // ৩. মেসেজ অ্যাপ ওপেন করা
      window.open(smsLink, '_system');

      toast.info("Message app opened! Please click SEND to verify.", { duration: 5000 });
      
      // ৪. পোলিং শুরু (অপেক্ষা করা কখন সার্ভার অ্যাপ্রুভ করবে)
      setIsVerifying(true);
      startPolling(data.requestId);

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Something went wrong");
      setIsLoading(false);
    }
  };

  // ৫. পোলিং ফাংশন (স্ট্যাটাস চেক করা)
  const startPolling = (requestId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/check-status', {
            method: 'POST',
            body: JSON.stringify({ requestId })
        });
        const data = await res.json();

        if (data.success) {
            clearInterval(pollInterval); // পোলিং বন্ধ
            login(data.user, data.token); // লগইন হুক কল
            toast.success("Device Verified Successfully! 🚀");
            router.push('/');
            router.refresh();
        }
      } catch (e) { console.error("Polling error", e); }
    }, 2000); // প্রতি ২ সেকেন্ডে চেক করবে

    // ১ মিনিট পর পোলিং অটোমেটিক বন্ধ (Timeout)
    setTimeout(() => {
        clearInterval(pollInterval);
        if(isLoading) {
            setIsLoading(false);
            setIsVerifying(false);
            // যদি ১ মিনিটেও ভেরিফাই না হয়
            // toast.error("Verification timeout. Please try again.");
        }
    }, 60000);
  };

  // ★★★ EMAIL LOGIN LOGIC (Existing) ★★★
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      login(data.user, data.token);
      toast.success('Welcome back!');
      router.push('/');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Google Login
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const result = await googleLogin();
    if (result.success) {
      toast.success('Successfully logged in with Google!');
      router.push('/');
      router.refresh();
    } else {
      toast.error(result.error || 'Google login failed');
    }
    setIsGoogleLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg border-0 sm:border">
        <CardHeader className="space-y-1 text-center pb-2">
          <CardTitle className="text-2xl font-bold tracking-tight text-primary font-headline">
            Bumba's Kitchen
          </CardTitle>
          <CardDescription>
            Login to continue ordering delicious food
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-4">
          
          {/* TABS System */}
          <Tabs defaultValue="phone" onValueChange={(v) => setLoginMethod(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="phone" className="gap-2">
                <Smartphone className="h-4 w-4" /> Phone
              </TabsTrigger>
              <TabsTrigger value="email" className="gap-2">
                <Mail className="h-4 w-4" /> Email
              </TabsTrigger>
            </TabsList>

            {/* PHONE LOGIN FORM */}
            <TabsContent value="phone" className="space-y-4">
                <form onSubmit={handlePhoneLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Mobile Number</Label>
                        <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                                +91
                            </span>
                            <Input 
                                type="tel" 
                                placeholder="9876543210" 
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                className="rounded-l-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                required
                                disabled={isLoading || isVerifying}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            We will open your SMS app. Just click "Send" to verify. Standard SMS charges apply.
                        </p>
                    </div>

                    <Button 
                        type="submit" 
                        className={`w-full ${isVerifying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary/90'}`} 
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isVerifying ? 'Waiting for SMS...' : 'Preparing...'}
                            </>
                        ) : (
                            <>
                                Verify & Login <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </form>
            </TabsContent>

            {/* EMAIL LOGIN FORM */}
            <TabsContent value="email">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email" type="email" placeholder="name@example.com"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        required disabled={isLoading}
                    />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                              Forgot password?
                            </Link>
                        </div>
                        <div className="relative">
                            <Input
                            id="password" type={showPassword ? 'text' : 'password'}
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            required disabled={isLoading}
                            placeholder="••••••••"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign in with Email'}
                    </Button>
                </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Or continue with</span></div>
          </div>

          <Button 
            variant="outline" 
            type="button" 
            className="w-full flex items-center justify-center gap-2 h-11" 
            onClick={handleGoogleSignIn} 
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleLogo className="h-5 w-5" />} 
            Continue with Google
          </Button>

        </CardContent>
        <CardFooter className="flex justify-center pb-6">
            <p className="text-sm text-gray-600">
                Don&apos;t have an account? <Link href="/register" className="font-semibold text-primary hover:underline">Sign up</Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}