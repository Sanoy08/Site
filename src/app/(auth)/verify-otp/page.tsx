'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';

function VerifyForm() {
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!phone) {
      router.replace('/login');
    }
  }, [phone, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      toast.success('Login Successful!');
      
      // রোল চেক করে রিডাইরেক্ট (যদিও Middleware হ্যান্ডেল করবে, তবুও ক্লায়েন্ট সাইডে ফাস্ট রেসপন্সের জন্য)
      if (data.user.role === 'admin') {
         // সাবডোমেইন লজিক থাকলে এখানে হ্যান্ডেল করতে পারেন, 
         // আপাতত আমরা মেইন পেজে পাঠাচ্ছি, Middleware বাকিটা দেখবে
         window.location.href = '/'; 
      } else {
         window.location.href = '/';
      }

    } catch (error: any) {
      toast.error(error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Verify OTP</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to <br />
            <span className="font-semibold text-gray-900">+91 {phone}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="flex justify-center">
              <Input
                type="text"
                placeholder="XXXXXX"
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 6) setOtp(val);
                }}
                className="text-center text-2xl tracking-[0.5em] h-14 font-bold max-w-[200px]"
                maxLength={6}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || otp.length < 6}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify & Login'}
            </Button>

            <div className="text-center mt-4">
              <Button variant="link" size="sm" onClick={() => router.push('/login')} className="text-gray-500">
                Change Number
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
        <VerifyForm />
      </Suspense>
    </div>
  );
}