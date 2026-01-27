// src/hooks/use-auth.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

// User Type Definition
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
  // (Cookies are automatically sent by the browser to the /me API)
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
  }, []); 

  // 2. Login Action (Updates local state only)
  // Note: The HTTP-only cookie is already set by the API response header
  const login = useCallback((userData: User) => {
    setUser(userData);
  }, []);

  // 3. Logout Action
  const logout = useCallback(async () => {
    try {
      // Call Backend to clear the http-only cookie
      await fetch('/api/auth/logout', { method: 'POST' });

      // Clear local state
      setUser(null);
      toast.success("Logged out successfully");
      
      // Redirect to login
      router.push('/login');
      router.refresh();
      
    } catch (e) {
      console.error("Logout error", e);
      toast.error("Logout failed");
    }
  }, [router]);

  // Google Login function removed entirely as per requirement

  return { 
    user, 
    isLoading, 
    login, 
    logout 
  };
}