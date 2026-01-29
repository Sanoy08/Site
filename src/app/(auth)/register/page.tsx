'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Loader2, ArrowRight, ChefHat, User, Phone, ArrowLeft, RefreshCw, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [step, setStep] = useState<'details' | 'otp'>('details');
  
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (step === 'otp' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, step]);

  const verifyRegisterLogic = async (otpValue: string) => {
    if (otpValue.length !== 6) return;
    
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
        toast.success('Account created successfully!');
        router.push('/');
      } else {
        toast.error(data.error || 'Verification failed');
        setIsLoading(false);
      }
    } catch (error) {
      toast.error('Registration failed.');
      setIsLoading(false);
    }
  };

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

    if (pastedData.length === 6) {
        verifyRegisterLogic(pastedData);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    const combinedOtp = newOtp.join('');
    if (combinedOtp.length === 6 && index === 5 && value) {
        verifyRegisterLogic(combinedOtp);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // 1. Send OTP Logic (With Validation)
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // ★★★ INDIAN NUMBER VALIDATION ★★★
    // Regex: Starts with 6-9, contains exactly 10 digits
    const indianPhoneRegex = /^[6-9]\d{9}$/;

    if (!phone) {
        toast.error("Please enter your phone number");
        return;
    }

    if (!indianPhoneRegex.test(phone)) {
        toast.error("Invalid Indian Mobile Number! Must contain 10 digits and start with 6-9.");
        return;
    }
    // ★★★ VALIDATION END ★★★

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/phone/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      
      if (data.success) {
        setStep('otp');
        setCanResend(false);
        setTimeLeft(30);
        setOtp(['', '', '', '', '', '']);
        toast.success(`OTP sent to +91 ${phone}`);
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error('Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
        toast.error("Please enter 6-digit OTP");
        return;
    }
    verifyRegisterLogic(otpValue);
  };

  return (
    <div className="fixed inset-0 z-[100] grid h-screen w-full grid-cols-1 overflow-hidden bg-white lg:grid-cols-2">
      <div className="flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-20 xl:px-28 overflow-y-auto">
        <div className="mx-auto w-full max-w-sm space-y-8 py-8">

          {/* SAFE ILLUSTRATION */}
          <div className="flex justify-center mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse"></div>
                <UserPlus className="h-10 w-10 text-primary relative z-10" />
             </div>
          </div>
          
          <div className="space-y-2 text-center sm:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Create an <span className="text-primary">Account</span>
            </h1>
            <p className="text-base text-gray-500">
              {step === 'details' ? 'Join Bumbas Kitchen using your phone number' : `Enter code sent to +91 ${phone}`}
            </p>
          </div>

          <div className="space-y-6">
            
            {step === 'details' && (
              <form onSubmit={handleSendOtp} className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-900">Full Name</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading} className="h-12 pl-10 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-900">Phone Number</Label>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                    {/* Country Code Prefix Visual */}
                    <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 border-r pr-2 h-5 flex items-center">+91</span>
                    <Input 
                        id="phone" 
                        type="tel"
                        inputMode="numeric"
                        maxLength={10} // Restrict input length
                        placeholder="9876543210" 
                        value={phone} 
                        // Only allow numbers
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, ''); 
                            if(val.length <= 10) setPhone(val);
                        }} 
                        disabled={isLoading} 
                        required 
                        className="h-12 pl-[4.5rem] border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl" 
                    />
                  </div>
                </div>

                <Button type="submit" className="group h-12 w-full bg-primary text-white hover:bg-primary/90 font-medium rounded-xl shadow-lg shadow-primary/20" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <span className="flex items-center gap-2">Send OTP <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>}
                </Button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                 <div className="space-y-4">
                    <div className="flex justify-center gap-2 sm:gap-3">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => { inputRefs.current[index] = el }}
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoComplete="one-time-code"
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

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep('details')} disabled={isLoading} className="h-12 w-1/3 rounded-xl border-gray-200 hover:bg-gray-50 text-gray-600">
                     <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button type="submit" className="h-12 w-2/3 bg-primary text-white hover:bg-primary/90 font-medium rounded-xl shadow-lg shadow-primary/20" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify & Sign Up'}
                  </Button>
                </div>
              </form>
            )}
            
          </div>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline hover:text-primary/80">Sign in</Link>
          </p>
        </div>
      </div>

      <div className="relative hidden h-full flex-col bg-gray-900 p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=2070&auto=format&fit=crop')` }}><div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" /></div>
        <div className="relative z-10 flex items-center gap-2 text-xl font-bold tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-lg"><ChefHat className="h-5 w-5" /></div>
          Bumbas Kitchen
        </div>
        <div className="relative z-10 mt-auto max-w-md">
          <blockquote className="space-y-2 border-l-2 border-primary pl-6">
            <p className="text-lg font-medium leading-relaxed text-white">&ldquo;Join our community of food lovers. Quality ingredients, authentic recipes, and unforgettable tastes await you.&rdquo;</p>
          </blockquote>
        </div>
      </div>
    </div>
  );
}