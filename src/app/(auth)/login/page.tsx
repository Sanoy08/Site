'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { signInWithGoogle } = useAuth(); // AuthContext থেকে setUser নেওয়ার দরকার নেই, অটো আপডেট হবে

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // ১. Firebase দিয়ে লগইন
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      
      // ২. টোকেন সংগ্রহ করা
      const idToken = await userCredential.user.getIdToken();

      // ৩. ★★★ ম্যানুয়ালি সেশন তৈরি করা (এটিই আপনার সমস্যার সমাধান) ★★★
      // আমরা এখানে অপেক্ষা করব যেন কুকি সেট হয়
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) throw new Error('Session creation failed');

      // ৪. সব ঠিক থাকলে রিডাইরেক্ট
      toast.success("Logged in successfully!");
      router.push('/account');
      router.refresh(); // নতুন কুকি পড়ার জন্য রিফ্রেশ

    } catch (error: any) {
      console.error(error);
      let message = "Login failed. Please try again.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = "Invalid email or password.";
      }
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleLogin = async () => {
    try {
        await signInWithGoogle();
        // Google Login এর ক্ষেত্রে AuthContext এর লজিক কাজ করবে, 
        // তবে ভালো হয় যদি সেখানেও রিডাইরেক্টের আগে লোডিং দেখানো হয়।
        // router.push('/account'); // এটি AuthContext বা Google Callback পেজে হ্যান্ডেল করা ভালো
    } catch (error) {
        // Error handling
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login</CardTitle>
          <CardDescription className="text-center">Enter your email below to login to your account.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="grid gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="m@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <Link 
                            href="/forgot-password" 
                            className="ml-auto inline-block text-sm underline text-muted-foreground hover:text-primary transition-colors"
                        >
                            Forgot your password?
                        </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            {...field} 
                            className="pr-10" 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in
              </Button>
              
              <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
              </div>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={handleGoogleLogin}
              >
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                Sign in with Google
              </Button>

              <div className="text-center text-sm">
                Don't have an account?{" "}
                <Link href="/register" className="underline hover:text-primary transition-colors">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}