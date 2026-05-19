// src/hooks/use-auth.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  picture?: string;
  wallet?: any;
};

const CACHE_KEY = 'bumbas_user_cache';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Check Session and Hydrate Cache
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      // ★ ম্যাজিক ১: লোকাল ক্যাশ থেকে ইনস্ট্যান্ট লোড (Zero Delay)
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        try {
          setUser(JSON.parse(cachedData));
          setIsLoading(false); // সাথে সাথে লোডিং বন্ধ!
        } catch (e) {
          localStorage.removeItem(CACHE_KEY);
        }
      }

      try {
        // ★ ম্যাজিক ২: ব্যাকগ্রাউন্ডে ফ্রেশ ডেটা আনা (Silent Revalidation)
        const res = await fetch('/api/auth/me', {
            cache: 'no-store', 
            headers: {
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache'
            }
        });
        
        const data = await res.json();
        
        if (data.success && data.user) {
          if (isMounted) {
            setUser(data.user);
            // ক্যাশ আপডেট করে দেওয়া হলো
            localStorage.setItem(CACHE_KEY, JSON.stringify(data.user));
          }
        } else {
          // সেশন এক্সপায়ার হয়ে গেলে বা সার্ভার ব্লক করলে
          if (isMounted) {
            setUser(null);
            localStorage.removeItem(CACHE_KEY);
          }
        }
      } catch (error) {
        // ★ ম্যাজিক ৩: অফলাইন সাপোর্ট
        // নেটওয়ার্ক না থাকলে ক্যাশ ডেটাই থেকে যাবে, ইউজার লগ-আউট হবে না!
        if (!cachedData && isMounted) {
            setUser(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []); 

  // 2. Login Action
  // login পেজ থেকে data.user এবং data.token দুটোই পাঠানো হয়, তাই প্যারামিটার আপডেট করা হলো
  const login = useCallback((userData: User, token?: string) => {
    setUser(userData);
    localStorage.setItem(CACHE_KEY, JSON.stringify(userData)); // লগইন করার সাথে সাথে ক্যাশ সেভ
  }, []);

  // 3. Logout Action
  const logout = useCallback(async () => {
    try {
      // Backend Cookie Clear
      await fetch('/api/auth/logout', { 
          method: 'POST',
          cache: 'no-store' 
      });

      // Clear local state and cache
      setUser(null);
      localStorage.removeItem(CACHE_KEY);
      toast.success("Logged out successfully");
      
      // Force Hard Reload
      window.location.href = '/login'; 
      
    } catch (e) {
      console.error("Logout error", e);
      toast.error("Logout failed");
    }
  }, []);

  return { 
    user, 
    isLoading, 
    login, 
    logout 
  };
}
