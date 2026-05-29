// src/context/AuthProvider.tsx


'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
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
  dob?: string;         // ★ Added
  anniversary?: string; // ★ Added
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (userData: User, token?: string) => void;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CACHE_KEY = 'bumbas_user_cache';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // অ্যাপ লোড হলে মাত্র একবার এই লজিক রান হবে!
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      // লোকাল ক্যাশ থেকে ইনস্ট্যান্ট লোড (Zero Delay)
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        try {
          setUser(JSON.parse(cachedData));
          setIsLoading(false);
        } catch (e) {
          localStorage.removeItem(CACHE_KEY);
        }
      }

      try {
        // ব্যাকগ্রাউন্ডে ফ্রেশ ডেটা আনা 
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
            localStorage.setItem(CACHE_KEY, JSON.stringify(data.user));
          }
        } else {
          if (isMounted) {
            setUser(null);
            localStorage.removeItem(CACHE_KEY);
          }
        }
      } catch (error) {
        if (!cachedData && isMounted) {
            setUser(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkSession();

    return () => { isMounted = false; };
  }, []); 

  const login = useCallback((userData: User, token?: string) => {
    setUser(userData);
    localStorage.setItem(CACHE_KEY, JSON.stringify(userData));
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' });
      setUser(null);
      localStorage.removeItem(CACHE_KEY);
      toast.success("Logged out successfully");
      window.location.href = '/login'; 
    } catch (e) {
      toast.error("Logout failed");
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}