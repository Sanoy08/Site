'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithEmailAndPassword, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // 1. Email/Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome back!");
      router.push('/account');
    } catch (error: any) {
      // Improve error messages based on error.code if needed
      toast.error("Login failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Google Login (Handles Mobile & Web)
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      
      if (Capacitor.isNativePlatform()) {
        // --- MOBILE FLOW ---
        await GoogleAuth.initialize();
        const nativeUser = await GoogleAuth.signIn();
        
        // Create a Firebase credential from the native ID token
        const credential = GoogleAuthProvider.credential(nativeUser.authentication.idToken);
        
        // Sign in to Firebase with that credential
        await signInWithCredential(auth, credential);
      } else {
        // --- WEB FLOW ---
        // For web, we can simply redirect or use popup
        // Note: For simplicity in this example, we aren't implementing the 
        // full web popup here, but standard Firebase web logic applies.
        // You can add: await signInWithPopup(auth, googleProvider);
        toast.error("Please use the mobile app for Google Sign-In or implement Web Popup.");
        return; 
      }

      toast.success("Logged in with Google!");
      router.push('/account');
    } catch (error: any) {
      console.error(error);
      if (error?.message !== 'User cancelled') {
        toast.error("Google Sign-In failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email to sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/reset-password" className="text-sm underline">Forgot?</Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign In
            </Button>
          </form>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2">Or</span></div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
            Sign in with Google
          </Button>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account? <Link href="/register" className="underline">Sign up</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}