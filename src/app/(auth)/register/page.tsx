// src/app/(auth)/register/page.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Loader2, ArrowRight, ChefHat, User, Phone, ArrowLeft, RefreshCw, UserPlus, ShieldAlert, AlertOctagon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ★ Capacitor Plugins
import { Capacitor, registerPlugin } from '@capacitor/core';
const NativeAuth = registerPlugin<any>('NativeAuth');

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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

  // ★ Native Phone Hint States
  const hasRequestedPhoneHint = useRef(false);
  const [suggestedPhone, setSuggestedPhone] = useState('');
  const [showPhoneConfirm, setShowPhoneConfirm] = useState(false);

  // ★ Rate Limit States
  const [limitData, setLimitData] = useState({ ipLeft: 5, phoneLeft: 3, isBlocked: false, resetTime: '', reason: '' });
  const [showBlockPopup, setShowBlockPopup] = useState(false);

  const fetchLimit = async (phoneVal: string = '') => {
    try {
        const res = await fetch(`/api/auth/phone/check-limit?phone=${phoneVal}`);
        const data = await res.json();
        if (data.success) {
            setLimitData(data);
            if (data.isBlocked) setShowBlockPopup(true);
        }
    } catch (e) {}
  };

  useEffect(() => { fetchLimit(); }, []);
  useEffect(() => { if (phone.length === 10) fetchLimit(phone); }, [phone]);

  useEffect(() => {
    if (step === 'otp' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) setCanResend(true);
  }, [timeLeft, step]);

  const formatResetTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) + ' on ' + d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  // ==========================================
  // ★ NATIVE: Request Phone Hint (Google Play)
  // ==========================================
  const requestNativePhoneHint = async () => {
      if (!Capacitor.isNativePlatform() || hasRequestedPhoneHint.current) return;
      
      hasRequestedPhoneHint.current = true;
      try {
          const result = await NativeAuth.requestPhoneHint();
          if (result && result.phone) {
              let cleanPhone = result.phone.replace(/\D/g, '');
              if (cleanPhone.length > 10) cleanPhone = cleanPhone.slice(-10);
              
              if (cleanPhone.length === 10) {
                  setSuggestedPhone(cleanPhone);
                  setShowPhoneConfirm(true); 
              }
          }
      } catch (e) {
          console.log("Native phone hint failed or cancelled.");
      }
  };

  // ==========================================
  // ★ NATIVE: Auto Read OTP (SMS Retriever)
  // ==========================================
  const listenForNativeOTP = async () => {
      if (!Capacitor.isNativePlatform()) return;
      try {
          const result = await NativeAuth.startSmsRetriever();
          if (result && result.otp) {
              const otpStr = String(result.otp).slice(0, 6);
              
              const newOtp = [...otp];
              otpStr.split('').forEach((char, index) => { if (index < 6) newOtp[index] = char; });
              setOtp(newOtp);
              
              toast.success("OTP Auto-filled!");
              verifyRegisterLogic(otpStr);
          }
      } catch (e) {
          console.log("OTP Retriever failed.");
      }
  };

  const verifyRegisterLogic = async (otpValue: string) => {
    if (otpValue.length !== 6) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/phone/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, otp: otpValue }),
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
    pastedData.split('').forEach((char, index) => { if (index < 6) newOtp[index] = char; });
    setOtp(newOtp);

    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
    if (pastedData.length === 6) verifyRegisterLogic(pastedData);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    const combinedOtp = newOtp.join('');
    if (combinedOtp.length === 6 && index === 5 && value) verifyRegisterLogic(combinedOtp);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (limitData.isBlocked) {
        setShowBlockPopup(true);
        return;
    }

    const indianPhoneRegex = /^[6-9]\d{9}$/;
    if (!phone) return toast.error("Please enter your phone number");
    if (!indianPhoneRegex.test(phone)) return toast.error("Invalid Indian Mobile Number!");

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/phone/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      
      if (data.success) {
        setStep('otp');
        setCanResend(false);
        setTimeLeft(30);
        setOtp(['', '', '', '', '', '']);
        toast.success(`OTP sent to +91 ${phone}`);
        fetchLimit(phone);

        // ★ SMS Retriever চালু করা
        listenForNativeOTP();

      } else {
        toast.error(data.error || 'Failed to send OTP');
        if (data.isBlocked || res.status === 429) {
            setLimitData(prev => ({ ...prev, isBlocked: true, reason: data.error, resetTime: data.resetTime }));
            setShowBlockPopup(true);
        }
      }
    } catch (error) {
      toast.error('Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <div className="fixed inset-0 z-[10] grid h-screen w-full grid-cols-1 overflow-hidden bg-white lg:grid-cols-2">
      <div className="flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-20 xl:px-28 overflow-y-auto">
        <div className="mx-auto w-full max-w-sm space-y-8 py-8">

          <div className="flex justify-center mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse"></div>
                <UserPlus className="h-10 w-10 text-primary relative z-10" />
             </div>
          </div>
          
          <div className="space-y-2 text-center sm:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Create an <span className="text-primary">Account</span></h1>
            <p className="text-base text-gray-500">{step === 'details' ? 'Join Bumbas Kitchen using your phone number' : `Enter code sent to +91 ${phone}`}</p>
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
                    <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 border-r pr-2 h-5 flex items-center">+91</span>
                    <Input id="phone" type="tel" inputMode="numeric" maxLength={10} placeholder="9876543210" value={phone}
                        onClick={requestNativePhoneHint} // ★ ক্লিক করলে নেটিভ পপআপ আসবে
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, ''); 
                            if(val.length <= 10) setPhone(val);
                        }} 
                        disabled={isLoading} required className="h-12 pl-[4.5rem] border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl" 
                    />
                  </div>
                  {phone.length === 10 && !limitData.isBlocked && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-medium animate-in fade-in text-gray-500">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            <span className={limitData.phoneLeft === 0 ? "text-red-500" : ""}>{limitData.phoneLeft} attempts left for this number</span>
                        </div>
                  )}
                </div>

                <Button type="submit" className="group h-12 w-full bg-primary text-white hover:bg-primary/90 font-medium rounded-xl shadow-lg shadow-primary/20" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <span className="flex items-center gap-2">Send OTP <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>}
                </Button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={(e) => { e.preventDefault(); verifyRegisterLogic(otp.join('')); }} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                 <div className="space-y-4">
                    <div className="flex justify-center gap-2 sm:gap-3">
                        {/* ★ autoComplete রিমুভ করা হয়েছে ★ */}
                        {otp.map((digit, index) => (
                            <input key={index} ref={(el) => { inputRefs.current[index] = el }} type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={1} value={digit} onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleKeyDown(index, e)} onPaste={handlePaste} disabled={isLoading} className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl sm:text-3xl font-bold border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all bg-white text-gray-900 disabled:opacity-50 caret-primary" />
                        ))}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Didn't receive code?</span>
                        {canResend ? (
                            <button type="button" onClick={() => handleSendOtp()} className="font-medium text-primary hover:underline flex items-center gap-1"><RefreshCw className="h-3 w-3" /> Resend</button>
                        ) : (
                            <span className="text-gray-400 font-medium">Resend in 00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep('details')} disabled={isLoading} className="h-12 w-1/3 rounded-xl border-gray-200 hover:bg-gray-50 text-gray-600"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                  <Button type="submit" className="h-12 w-2/3 bg-primary text-white hover:bg-primary/90 font-medium rounded-xl shadow-lg shadow-primary/20" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify & Sign Up'}
                  </Button>
                </div>
              </form>
            )}
          </div>
          <p className="text-center text-sm text-gray-500">
            Already have an account? <Link href="/login" className="font-semibold text-primary hover:underline hover:text-primary/80">Sign in</Link>
          </p>
        </div>
      </div>

      <div className="relative hidden h-full flex-col bg-gray-900 p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=2070&auto=format&fit=crop')` }}><div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" /></div>
        <div className="relative z-10 flex items-center gap-2 text-xl font-bold tracking-tight"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-lg"><ChefHat className="h-5 w-5" /></div> Bumbas Kitchen</div>
        <div className="relative z-10 mt-auto max-w-md"><blockquote className="space-y-2 border-l-2 border-primary pl-6"><p className="text-lg font-medium leading-relaxed text-white">&ldquo;Join our community of food lovers. Quality ingredients, authentic recipes, and unforgettable tastes await you.&rdquo;</p></blockquote></div>
      </div>
    </div>

    {/* ★ PHONE CONFIRMATION POPUP ★ */}
    <AlertDialog open={showPhoneConfirm} onOpenChange={setShowPhoneConfirm}>
        <AlertDialogContent className="rounded-2xl max-w-[90vw] sm:max-w-[400px]">
            <div className="flex flex-col items-center text-center space-y-4 pt-4">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Phone className="h-8 w-8 text-primary" />
                </div>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold text-gray-900">Use this number?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-600">
                        Do you want to proceed with the selected phone number?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                
                <div className="bg-gray-50 border border-gray-200 w-full rounded-xl p-4 flex items-center justify-center gap-2">
                    <span className="text-gray-500 font-medium">+91</span>
                    <span className="text-2xl font-bold tracking-widest text-gray-900">{suggestedPhone}</span>
                </div>
            </div>
            <AlertDialogFooter className="mt-6 flex gap-3 sm:justify-center">
                <AlertDialogCancel onClick={() => { setShowPhoneConfirm(false); setSuggestedPhone(''); }} className="flex-1 rounded-xl h-12">
                    No, type manually
                </AlertDialogCancel>
                <AlertDialogAction onClick={() => { setPhone(suggestedPhone); setShowPhoneConfirm(false); }} className="flex-1 rounded-xl h-12 bg-primary text-white shadow-md">
                    Yes, Continue
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    {/* ★ LIMIT REACHED POPUP ★ */}
    <AlertDialog open={showBlockPopup} onOpenChange={setShowBlockPopup}>
        <AlertDialogContent className="rounded-2xl max-w-[90vw] sm:max-w-[400px]">
          <div className="flex flex-col items-center text-center space-y-4 pt-4">
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertOctagon className="h-8 w-8 text-red-600" />
              </div>
              <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold text-gray-900">Security Lock Active</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-600 leading-relaxed">
                      {limitData.reason} To protect your account from spam, we've temporarily paused OTPs.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="bg-gray-50 border w-full rounded-xl p-4 flex flex-col items-center justify-center space-y-1">
                  <Clock className="h-5 w-5 text-gray-400 mb-1" />
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Try again at</p>
                  <p className="text-lg font-bold text-gray-800">{formatResetTime(limitData.resetTime)}</p>
              </div>
          </div>
          <AlertDialogFooter className="mt-6 sm:justify-center">
            <AlertDialogAction onClick={() => setShowBlockPopup(false)} className="w-full rounded-xl bg-gray-900 text-white h-12 text-base shadow-md hover:bg-gray-800">
                I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}