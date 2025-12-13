'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onIdTokenChanged, 
  User as FirebaseUser,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  picture?: string;
  phone?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ১. ইনিশিয়াল লোডিং এবং সেশন চেক
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error('Session check failed', error);
      } finally {
        setLoading(false);
      }
    };
    checkSession();

    // ২. Firebase টোকেন লিসেনার (লগইনের সময় অটো সিঙ্ক হওয়ার জন্য)
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Firebase লগইন হয়েছে, এখন ব্যাকএন্ডে সেশন তৈরি করি
        const token = await firebaseUser.getIdToken();
        await createBackendSession(token);
      }
    });

    return () => unsubscribe();
  }, []);

  // ৩. ব্যাকএন্ডে সেশন তৈরির ফাংশন
  const createBackendSession = async (idToken: string) => {
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to create session', error);
      toast.error('Login synchronization failed.');
    }
  };

  // ৪. গুগল লগইন
  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Logged in with Google!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    }
  };

  // ৫. লগআউট
  const logout = async () => {
    try {
      await firebaseSignOut(auth); // Firebase থেকে লগআউট
      await fetch('/api/auth/logout', { method: 'POST' }); // সেশন কুকি ডিলেট
      setUser(null);
      router.push('/login');
      router.refresh();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};