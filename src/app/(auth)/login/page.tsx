// src/app/(auth)/login/page.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Loader2, ArrowRight, ChefHat, Phone, ArrowLeft, RefreshCw, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Capacitor } from '@capacitor/core';
import { PhoneHint } from '@ak3696/capacitor-phone-hint';
import { SmsRetriever } from '@shaher/capacitor-sms-retriever';

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

  // ★★★ 1. GOOGLE PHONE HINT (Auto Phone Number) ★★★
  const requestPhoneHint = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const { phoneNumber } = await PhoneHint.requestHint();
        if (phoneNumber) {
          // রিমুভ +91 যদি থাকে, শুধু ১০ ডিজিট রাখবে
          let cleanPhone = phoneNumber.replace('+91', '').replace(/\D/g, '');
          if (cleanPhone.length > 10) {
              cleanPhone = cleanPhone.slice(-10); // লাস্ট ১০ ডিজিট
          }
          setPhone(cleanPhone);
        }
      } catch (error) {
        console.log("Phone hint cancelled or failed", error);
      }
    }
  };

  // ★★★ 2. SMS RETRIEVER (Auto OTP Read) ★★★
  const startSmsListener = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        // লিসেনার চালু করা হলো
        const { message } = await SmsRetriever.startSmsReceiver();
        
        if (message) {
            // মেসেজ থেকে ৬ ডিজিটের কোড বের করা
            const match = message.match(/\b\d{6}\b/);
            if (match && match[0]) {
                const code = match[0];
                const newOtp = code.split('');
                setOtp(newOtp);
                toast.success("OTP Auto-filled!");
                // অটোমেটিক ভেরিফাই কল
                verifyOtpLogic(code);
            }
        }
      } catch (error) {
        console.log("SMS Retriever failed or timeout", error);
      }
    }
  };

  useEffect(() => {
    if (step === 'otp') {
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  const verifyOtpLogic = async (otpValue: string) => {
    if (otpValue.length !== 6) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otpValue }),
      });
      const data = await res.json();
 <Button 
  type="button" 
  onClick={async () => {
    try {
      const { SmsRetriever } = await import('@shaher/capacitor-sms-retriever');
      const res = await SmsRetriever.getAppSignature();
      alert("Hash Code: " + res.signature);
    } catch (e) {
      alert("Error: Only works on Android Phone!");
    }
  }}
  className="bg-red-500 mb-4"
>
  GET APP HASH
</Button>
      if (data.success) {
        // Remove listener
        if (Capacitor.isNativePlatform()) SmsRetriever.removeSmsReceiver();
        
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
        setIsLoading(false);
      }
    } catch (error) {
      toast.error('Login failed');
      setIsLoading(false);
    }
  };

  // ... (handlePaste, handleOtpChange, handleKeyDown same as before)
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, index) => {
        if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);

    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();

    if (pastedData.length === 6) verifyOtpLogic(pastedData);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); 
    setOtp(newOtp);

    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    
    const combinedOtp = newOtp.join('');
    if (combinedOtp.length === 6 && index === 5 && value) {
        verifyOtpLogic(combinedOtp);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

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
        setOtp(['', '', '', '', '', '']);
        toast.success('OTP Sent!');
        
        // ★ SMS Listener চালু করা হচ্ছে
        startSmsListener();
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error('Connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
        toast.error("Please enter 6-digit OTP");
        return;
    }
    verifyOtpLogic(otpValue);
  };

  return (
    <div className="fixed inset-0 z-[100] grid h-screen w-full grid-cols-1 overflow-hidden bg-white lg:grid-cols-2">
      <div className="flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-20 xl:px-28">
        <div className="mx-auto w-full max-w-sm space-y-8">

          <div className="flex justify-center mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse"></div>
                <LockKeyhole className="h-10 w-10 text-primary relative z-10" />
             </div>
          </div>
          
          <div className="space-y-2 text-center sm:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Welcome <span className="text-primary">Back</span>
            </h1>
            <p className="text-base text-gray-500">
              {step === 'phone' ? 'Sign in with your phone number' : `Enter code sent to +91 ${phone}`}
            </p>
          </div>

          <div className="space-y-6">
            {step === 'phone' && (
                <form onSubmit={handleSendOtp} className="space-y-5 animate-in fade-in slide-in-from-left-4">
                <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-900">Phone Number</Label>
                    <div className="relative group">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                        <Input
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        placeholder="9876543210"
                        value={phone}
                        onClick={requestPhoneHint} // ★ Click করলেই পপআপ আসবে
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
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

            {step === 'otp' && (
                <form onSubmit={handleVerifySubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="space-y-4">
                        <div className="flex justify-center gap-2 sm:gap-3">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => { inputRefs.current[index] = el }}
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                    disabled={isLoading}
                                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl sm:text-3xl font-bold border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all bg-white text-gray-900 disabled:opacity-50 caret-primary"
                                />
                            ))}
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Didn't receive code?</span>
                            {canResend ? (
                                <button type="button" onClick={() => handleSendOtp()} className="font-medium text-primary hover:underline flex items-center gap-1">
                                    <RefreshCw className="h-3 w-3" /> Resend
                                </button>
                            ) : (
                                <span className="text-gray-400 font-medium">Resend in 00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={() => {
                            setStep('phone');
                            if (Capacitor.isNativePlatform()) SmsRetriever.removeSmsReceiver();
                        }} disabled={isLoading} className="h-12 w-1/3 rounded-xl border-gray-200 hover:bg-gray-50 text-gray-600">
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
      <div className="relative hidden h-full flex-col bg-gray-900 p-10 text-white lg:flex">
         {/* Background Banner details */}
         <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2069&auto=format&fit=crop')` }}><div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" /></div>
        <div className="relative z-10 flex items-center gap-2 text-xl font-bold tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-lg"><ChefHat className="h-5 w-5" /></div>
          Bumbas Kitchen
        </div>
      </div>
    </div>
  );
}