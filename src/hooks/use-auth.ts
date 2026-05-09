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
  dob?: string;          // নতুন যোগ করা হলো
  anniversary?: string;  // নতুন যোগ করা হলো
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me', {
            cache: 'no-store',
            headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
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

  const login = useCallback((userData: User) => setUser(userData), []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' });
      setUser(null);
      toast.success("Logged out successfully");
      window.location.href = '/login'; 
    } catch (e) {
      toast.error("Logout failed");
    }
  }, []);

  return { user, isLoading, login, logout, setUser }; // setUser টা এক্সপোর্ট করলাম যাতে প্রোফাইল আপডেটের পর স্টেট আপডেট করা যায়
}