'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Loader2, ArrowRight, ChefHat, User, Phone, KeyRound, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth(); // Google Login Removed
  
  // Form States (Email Removed)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // OTP State
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [otp, setOtp] = useState('');
  
  // Loading States
  const [isLoading, setIsLoading] = useState(false);

  // 1. Send OTP Logic
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // NOTE: We ARE sending 'name'. Backend will treat this as Register.
      const res = await fetch('/api/auth/phone/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }), // No Email
      });
      const data = await res.json();
      
      if (data.success) {
        setStep('otp');
        toast.success(`OTP sent to ${phone}`);
      } else {
        // Backend now returns specific error "Account already exists"
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error('Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Verify OTP & Create Account
  const handleRegister = async (e: React.FormEvent) => {
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
        login(data.user, data.token);
        toast.success('Account created successfully!');
        router.push('/');
      } else {
        toast.error(data.error || 'Verification failed');
      }
    } catch (error) {
      toast.error('Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] grid h-screen w-full grid-cols-1 overflow-hidden bg-white lg:grid-cols-2">
      
      {/* LEFT SIDE: Form */}
      <div className="flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-20 xl:px-28 overflow-y-auto">
        <div className="mx-auto w-full max-w-sm space-y-8 py-8">
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Create an <span className="text-primary">Account</span>
            </h1>
            <p className="text-base text-gray-500">
              Join Bumbas Kitchen using your phone number
            </p>
          </div>

          <div className="space-y-6">
            
            {/* STEP 1: Personal Details */}
            {step === 'details' && (
              <form onSubmit={handleSendOtp} className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-900">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading} className="h-12 pl-10 border-gray-200 focus:border-primary focus:ring-primary" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-900">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                        id="phone" 
                        type="tel" 
                        placeholder="9876543210" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                        disabled={isLoading} 
                        required 
                        className="h-12 pl-10 border-gray-200 focus:border-primary focus:ring-primary" 
                    />
                  </div>
                </div>

                {/* Email Field REMOVED */}

                <Button type="submit" className="group h-12 w-full bg-primary text-white hover:bg-primary/90 font-medium" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <span className="flex items-center gap-2">Send OTP <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>}
                </Button>
              </form>
            )}

            {/* STEP 2: OTP */}
            {step === 'otp' && (
              <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                 <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-medium text-gray-900">One-Time Password (OTP)</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input id="otp" placeholder="Enter 6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} required disabled={isLoading} className="h-12 pl-10 border-gray-200 focus:border-primary focus:ring-primary tracking-widest font-bold text-center text-lg" />
                  </div>
                  <p className="text-xs text-gray-500 text-center">We sent a code to {phone}</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep('details')} disabled={isLoading} className="h-12 w-1/3 border-gray-200 hover:bg-gray-50">
                     <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button type="submit" className="h-12 w-2/3 bg-primary text-white hover:bg-primary/90 font-medium shadow-lg shadow-primary/20" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify & Sign Up'}
                  </Button>
                </div>
              </form>
            )}

            {/* Google Signup REMOVED */}
            
          </div>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline hover:text-primary/80">Sign in</Link>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Image */}
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