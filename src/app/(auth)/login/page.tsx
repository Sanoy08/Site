// src/app/(auth)/login/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, Smartphone, Mail, Send } from 'lucide-react'; // Icons
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
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('phone'); // Default Phone
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false); // For Phone Polling

  // ★★★ PHONE LOGIN LOGIC ★★★
  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!Capacitor.isNativePlatform()) {
      toast.error("Phone login works only on mobile app.");
      return;
    }
    
    setIsLoading(true);
    try {
      // 1. Request OTP
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      
      if (!data.success) throw new Error("Failed to start login");

      // 2. Send Background SMS
      const smsMessage = `VERIFY-${data.otpCode}`;
      const targetPhone = data.targetPhone;

      // টাইপস্ক্রিপ্ট এরর এড়াতে window as any
      const sms = (window as any).sms; 

      if (!sms) throw new Error("SMS Plugin missing");

      // Permission Check
      const hasPermission = await sms.hasPermission();
      if (!hasPermission) {
          await sms.requestPermission();
      }

      // Send SMS (intent: '' মানে ব্যাকগ্রাউন্ডে যাবে)
      sms.send(targetPhone, smsMessage, { android: { intent: '' } }, 
        () => {
          toast.success("Verifying device... please wait.");
          setIsVerifying(true);
          startPolling(data.requestId); // 3. Start Polling
        },
        (err: any) => {
          toast.error("SMS Permission Denied or Failed.");
          setIsLoading(false);
        }
      );

    } catch (error: any) {
      toast.error(error.message);
      setIsLoading(false);
    }
  };

  // 4. Polling Function (Check Status every 2s)
  const startPolling = (requestId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/check-status', {
            method: 'POST',
            body: JSON.stringify({ requestId })
        });
        const data = await res.json();

        if (data.success) {
            clearInterval(interval);
            login(data.user, data.token);
            toast.success("Device Verified! Logging in...");
            router.push('/');
        }
      } catch (e) { console.error(e); }
    }, 2000); // প্রতি ২ সেকেন্ডে চেক করবে

    // ১ মিনিট পর পোলিং বন্ধ (Timeout)
    setTimeout(() => {
        clearInterval(interval);
        if(isLoading) {
            setIsLoading(false);
            setIsVerifying(false);
            toast.error("Verification timeout. Try again.");
        }
    }, 60000);
  };

  // Email Login (Old Logic)
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
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">
            Welcome to Bumba's Kitchen
          </CardTitle>
          <CardDescription>
            Choose your preferred login method
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          
          {/* TABS for Switching Methods */}
          <Tabs defaultValue="phone" onValueChange={(v) => setLoginMethod(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="phone" className="gap-2">
                <Smartphone className="h-4 w-4" /> Phone (Auto)
              </TabsTrigger>
              <TabsTrigger value="email" className="gap-2">
                <Mail className="h-4 w-4" /> Email
              </TabsTrigger>
            </TabsList>

            {/* PHONE LOGIN FORM */}
            <TabsContent value="phone">
                <form onSubmit={handlePhoneLogin} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input 
                            type="tel" 
                            placeholder="+91 9000000000" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Note: Standard SMS charges may apply.
                        </p>
                    </div>
                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isVerifying ? 'Verifying Device...' : 'Sending SMS...'}
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" /> Verify & Login
                            </>
                        )}
                    </Button>
                </form>
            </TabsContent>

            {/* EMAIL LOGIN FORM */}
            <TabsContent value="email">
                <form onSubmit={handleEmailLogin} className="space-y-4 mt-4">
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
                            <Link href="/forgot-password" className="text-sm text-primary hover:underline">Forgot?</Link>
                        </div>
                        <div className="relative">
                            <Input
                            id="password" type={showPassword ? 'text' : 'password'}
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            required disabled={isLoading}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign in'}
                    </Button>
                </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Or continue with</span></div>
          </div>

          <Button variant="outline" type="button" className="w-full flex items-center justify-center gap-2" onClick={() => googleLogin()} disabled={isLoading || isGoogleLoading}>
            {isGoogleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleLogo className="h-5 w-5" />} Google
          </Button>

        </CardContent>
        <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600">
                Don&apos;t have an account? <Link href="/register" className="font-semibold text-primary hover:underline">Sign up</Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}