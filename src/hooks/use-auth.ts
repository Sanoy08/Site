// src/hooks/use-auth.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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
  const [token, setToken] = useState<string | null>(null); // ★ টোকেন স্টেট
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token'); // ★ টোকেন লোড

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
        setToken(storedToken); // ★ টোকেন সেট
    }

    setIsLoading(false);
  }, []);

  const login = useCallback((userData: User, newToken: string) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', newToken);
    setUser(userData);
    setToken(newToken); // ★ লগইনে টোকেন আপডেট
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null); // ★ লগআউটে টোকেন রিমুভ
    router.push('/login');
    router.refresh();
  }, [router]);

  // ★ এই রিটার্নে 'token' থাকা বাধ্যতামূলক
  return { user, token, isLoading, login, logout };
}