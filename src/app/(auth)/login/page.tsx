// src/app/(auth)/login/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, ArrowRight, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleLogo } from '@/components/icons/GoogleLogo';

export default function LoginPage() {
  const router = useRouter();
  const { login, googleLogin } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // 1. Email Login Logic
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

  // 2. Google Login Logic
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const result = await googleLogin();
    
    if (result.success) {
      toast.success('Successfully logged in!');
      router.push('/');
      router.refresh();
    } else {
      toast.error(result.error || 'Google login failed');
    }
    setIsGoogleLoading(false);
  };

  return (
    // Fixed & Z-Index [100] ensures full visibility over any header/navbar
    <div className="fixed inset-0 z-[100] grid h-screen w-full grid-cols-1 overflow-hidden bg-white lg:grid-cols-2">
      
      {/* LEFT SIDE: Login Form */}
      <div className="flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-20 xl:px-28">
        
        <div className="mx-auto w-full max-w-sm space-y-8">
          
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Welcome <span className="text-primary">Back</span>
            </h1>
            <p className="text-base text-gray-500">
              Enter your email to sign in to your account
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <form onSubmit={handleEmailLogin} className="space-y-5">
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-900">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading || isGoogleLoading}
                  // Changed focus color to Primary
                  className="h-12 border-gray-200 bg-white px-4 text-base transition-all placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-900">Password</Label>
                  {/* Link Color restored to Primary */}
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-primary hover:text-primary/80 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading || isGoogleLoading}
                    // Changed focus color to Primary
                    className="h-12 border-gray-200 bg-white px-4 text-base transition-all placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Main Button with Primary Color */}
              <Button 
                type="submit" 
                className="group h-12 w-full bg-primary text-white hover:bg-primary/90 font-medium" 
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign in <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-white px-3 text-gray-500">Or continue with</span>
              </div>
            </div>

            <Button
              variant="outline"
              type="button"
              className="h-12 w-full gap-3 border-gray-200 bg-white text-[15px] font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              onClick={handleGoogleSignIn}
              disabled={isLoading || isGoogleLoading}
            >
              {isGoogleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GoogleLogo className="h-5 w-5" />
              )}
              Google
            </Button>
          </div>

          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            {/* Link Color restored to Primary */}
            <Link href="/register" className="font-semibold text-primary hover:underline hover:text-primary/80">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Visual Experience */}
      <div className="relative hidden h-full flex-col bg-gray-900 p-10 text-white lg:flex">
        {/* Background Image */}
        <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ 
                // High quality food image
                backgroundImage: `url('https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2069&auto=format&fit=crop')` 
            }}
        >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xl font-bold tracking-tight">
          {/* Logo Icon with Primary Color Background */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-lg">
            <ChefHat className="h-5 w-5" />
          </div>
          Bumbas Kitchen
        </div>

        <div className="relative z-10 mt-auto max-w-md">
          <blockquote className="space-y-2 border-l-2 border-primary pl-6">
            <p className="text-lg font-medium leading-relaxed text-white">
              &ldquo;Experience the finest culinary delights delivered right to your doorstep. Taste the tradition, embrace the quality.&rdquo;
            </p>
          </blockquote>
        </div>
      </div>

    </div>
  );
}