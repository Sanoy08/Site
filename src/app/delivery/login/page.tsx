'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Loader2, Lock, User, Bike, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DeliveryLogin() {
  const router = useRouter();
  const { login, user } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // যদি অলরেডি লগইন থাকে, রিডাইরেক্ট করো
  useEffect(() => {
    if (user && user.role === 'delivery') {
      router.replace('/delivery');
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Login failed');

      if (data.user.role !== 'delivery' && data.user.role !== 'admin') {
        throw new Error("Access Denied. Not a delivery partner account.");
      }

      if (data.user.isVerified === false) {
        throw new Error("Account pending approval from Admin.");
      }

      // Context আপডেট
      login(data.user, data.token); 
      
      toast.success("Welcome Partner! 🏍️");

      // ★★★ ফিক্স: আগে রিফ্রেশ, তারপর রিডাইরেক্ট ★★★
      // এটি মিডলওয়্যারকে নতুন কুকি চিনতে সাহায্য করবে
      router.refresh(); 
      setTimeout(() => {
          router.replace('/delivery');
      }, 500); // হাফ সেকেন্ড সময় দিচ্ছি যাতে কুকি সেট হয়ে যায়

    } catch (err: any) {
      setError(err.message);
      toast.error("Login Failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* Background Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-blue-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[0%] right-[0%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[100px]" />
      </div>

      <Card className="w-full max-w-md bg-white/95 backdrop-blur shadow-2xl border-0 relative z-10">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-slate-100 p-3 rounded-full w-fit mb-4">
            <Bike className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">
            Partner Portal
          </CardTitle>
          <CardDescription>
            Login to verify deliveries & manage earnings
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Access Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  type="email"
                  placeholder="Partner Email / ID"
                  className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  type="password"
                  placeholder="Password"
                  className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 font-bold text-lg bg-gradient-to-r from-primary to-blue-700 hover:to-blue-800 transition-all shadow-lg active:scale-95" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Start Duty'
              )}
            </Button>
          </form>

          <div className="pt-4 text-center">
            <p className="text-xs text-slate-400">
              Having trouble? <a href="#" className="text-primary font-bold hover:underline">Contact Admin</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}