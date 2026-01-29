// src/app/(auth)/login/page.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Loader2, ArrowRight, ChefHat, Phone, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Timer Logic
  useEffect(() => {
    if (step === 'otp' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, step]);

  // Handle OTP Input Change
  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto Focus Next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto Verify if complete
    if (index === 5 && value) {
        // Optional: Trigger verify automatically
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // 1. Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/phone/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }), 
      });
      const data = await res.json();

      if (data.success) {
        setStep('otp');
        setCanResend(false);
        setTimeLeft(30);
        toast.success('OTP Sent!');
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error('Connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
        toast.error("Please enter 6-digit OTP");
        return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otpValue }),
      });
      const data = await res.json();

      if (data.success) {
        login(data.user, data.token);
        toast.success('Welcome back!');
        
        if (data.user.role === 'admin') {
            if (process.env.NODE_ENV === 'production') {
                window.location.href = 'https://admin.bumbaskitchen.app';
            } else {
                router.push('/admin/dashboard');
            }
        } else {
            router.push('/');
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

  return (
    <div className="fixed inset-0 z-[100] grid h-screen w-full grid-cols-1 overflow-hidden bg-white lg:grid-cols-2">
      
      {/* LEFT SIDE: Form */}
      <div className="flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-20 xl:px-28">
        <div className="mx-auto w-full max-w-sm space-y-8">
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Welcome <span className="text-primary">Back</span>
            </h1>
            <p className="text-base text-gray-500">
              {step === 'phone' ? 'Sign in with your phone number' : `Enter code sent to +91 ${phone}`}
            </p>
          </div>

          <div className="space-y-6">
            
            {/* Step 1: Phone */}
            {step === 'phone' && (
                <form onSubmit={handleSendOtp} className="space-y-5 animate-in fade-in slide-in-from-left-4">
                <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-900">Phone Number</Label>
                    <div className="relative group">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                        <Input
                        id="phone"
                        type="tel"
                        placeholder="9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-12 border-gray-200 bg-white pl-10 text-base focus:border-primary focus:ring-1 focus:ring-primary rounded-xl"
                        />
                    </div>
                </div>

                <Button type="submit" className="group h-12 w-full bg-primary text-white hover:bg-primary/90 font-medium rounded-xl shadow-lg shadow-primary/20" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <span className="flex items-center justify-center gap-2">Get OTP <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>}
                </Button>
                </form>
            )}

            {/* Step 2: OTP (Enhanced UI) */}
            {step === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="space-y-4">
                        <div className="flex justify-between gap-2">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => { inputRefs.current[index] = el }}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all bg-white text-gray-900"
                                />
                            ))}
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Didn't receive code?</span>
                            {canResend ? (
                                <button 
                                    type="button" 
                                    onClick={() => handleSendOtp()} 
                                    className="font-medium text-primary hover:underline flex items-center gap-1"
                                >
                                    <RefreshCw className="h-3 w-3" /> Resend
                                </button>
                            ) : (
                                <span className="text-gray-400 font-medium">Resend in 00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={() => setStep('phone')} disabled={isLoading} className="h-12 w-1/3 rounded-xl border-gray-200 hover:bg-gray-50 text-gray-600">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button type="submit" className="h-12 w-2/3 bg-primary text-white hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify & Login'}
                        </Button>
                    </div>
                </form>
            )}

          </div>

          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-primary hover:underline hover:text-primary/80">Sign up free</Link>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Image */}
      <div className="relative hidden h-full flex-col bg-gray-900 p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2069&auto=format&fit=crop')` }}><div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" /></div>
        <div className="relative z-10 flex items-center gap-2 text-xl font-bold tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-lg"><ChefHat className="h-5 w-5" /></div>
          Bumbas Kitchen
        </div>
        <div className="relative z-10 mt-auto max-w-md">
          <blockquote className="space-y-2 border-l-2 border-primary pl-6">
            <p className="text-lg font-medium leading-relaxed text-white">&ldquo;Experience the finest culinary delights delivered right to your doorstep.&rdquo;</p>
          </blockquote>
        </div>
      </div>
    </div>
  );
}