// src/hooks/use-auth.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase"; 
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  picture?: string;
  dob?: string;
  anniversary?: string;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user data", e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    
    if (storedToken) {
        setToken(storedToken);
    }

    setIsLoading(false);
  }, []);

  const login = useCallback((userData: User, newToken: string) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', newToken);
    setUser(userData);
    setToken(newToken);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await FirebaseAuthentication.signOut();
      } else {
        await auth.signOut();
      }
    } catch (e) {
      console.error("Firebase signout error", e);
    }
    
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    router.push('/login');
    router.refresh();
  }, [router]);

  // ★ New: Unified Google Login Function (Web + Mobile)
  const googleLogin = useCallback(async () => {
    setIsLoading(true);
    try {
      let idToken = "";

      if (Capacitor.isNativePlatform()) {
        // ★★★ MOBILE FIX ★★★
        
        // 1. Google সাইন-ইন পপ-আপ ওপেন করুন এবং নেটিভ লেয়ারে অথেন্টিকেট করুন
        await FirebaseAuthentication.signInWithGoogle();

        // 2. এরপর সরাসরি Firebase থেকে কারেন্ট ইউজার-এর টোকেনটি চান।
        // এটি সেই টোকেন রিটার্ন করবে যার 'aud' (audience) হবে আপনার Firebase Project ID.
        // আগের কোডে 'result.credential.idToken' নিচ্ছিলেন যা ছিল Google-এর টোকেন।
        const result = await FirebaseAuthentication.getIdToken();
        idToken = result.token;

      } else {
        // 2. WEB FLOW (Firebase JS SDK)
        const result = await signInWithPopup(auth, googleProvider);
        idToken = await result.user.getIdToken();
      }

      if (!idToken) throw new Error("Failed to retrieve Firebase ID Token");

      // 3. Send Token to Backend "Bridge" API
      const response = await fetch('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });

      const data = await response.json();

      if (data.success) {
        // 4. Save backend session (keeps your existing cart/orders working)
        login(data.user, data.token);
        return { success: true };
      } else {
        throw new Error(data.error || "Login failed on server");
      }

    } catch (error: any) {
      console.error("Google Login Error", error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  return { user, token, isLoading, login, logout, googleLogin };
}