// src/hooks/use-auth.ts

'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { auth, googleProvider } from "@/lib/firebase"; 
import { signInWithPopup } from "firebase/auth";

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  picture?: string;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // 1. Check Session on Mount (Cookies automatically sent)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []); // Run once on mount

  // 2. Login (Just update state, cookie is set by server)
  const login = useCallback((userData: User) => {
    setUser(userData);
    // No localStorage logic needed!
  }, []);

  // 3. Logout (Call API to clear cookie)
  const logout = useCallback(async () => {
    try {
      // Firebase Signout (Frontend)
      if (Capacitor.isNativePlatform()) {
        await FirebaseAuthentication.signOut();
      } else {
        await auth.signOut();
      }

      // Backend Cookie Clear
      await fetch('/api/auth/logout', { method: 'POST' });

      setUser(null);
      toast.success("Logged out successfully");
      router.push('/login');
      router.refresh();
      
    } catch (e) {
      console.error("Logout error", e);
    }
  }, [router]);

  // 4. Google Login Wrapper
  const googleLogin = useCallback(async () => {
    setIsLoading(true);
    try {
      let idToken = "";

      if (Capacitor.isNativePlatform()) {
        await FirebaseAuthentication.signInWithGoogle();
        const result = await FirebaseAuthentication.getIdToken();
        idToken = result.token;
      } else {
        const result = await signInWithPopup(auth, googleProvider);
        idToken = await result.user.getIdToken();
      }

      if (!idToken) throw new Error("Failed to retrieve Firebase ID Token");

      // Send to backend (Backend sets the cookie)
      const response = await fetch('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });

      const data = await response.json();

      if (data.success) {
        login(data.user); // Update local state
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

  return { user, isLoading, login, logout, googleLogin };
}