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
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // 1. Check Session on Mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // ★★★ FIX: caching বন্ধ করা হলো
        const res = await fetch('/api/auth/me', {
            cache: 'no-store', // সার্ভার থেকে ফ্রেশ ডাটা আনবে
            headers: {
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache'
            }
        });
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
  }, []); 

  // 2. Login Action
  const login = useCallback((userData: User) => {
    setUser(userData);
  }, []);

  // 3. Logout Action
  const logout = useCallback(async () => {
    try {
      // Backend Cookie Clear
      await fetch('/api/auth/logout', { 
          method: 'POST',
          cache: 'no-store' 
      });

      // Clear local state
      setUser(null);
      toast.success("Logged out successfully");
      
      // Force Hard Reload to clear any JS memory
      // router.push দিয়ে অনেক সময় স্টেট থেকে যায়
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