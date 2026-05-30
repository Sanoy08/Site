// src/components/providers/StoreStatusProvider.tsx

'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Store, Clock, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import Pusher from 'pusher-js';

export function StoreStatusProvider({ children }: { children: React.ReactNode }) {
  const [isStoreOpen, setIsStoreOpen] = useState<boolean | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  // ★ FIX: Removed [pathname] dependency. It will only check once on initial load.
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        const data = await res.json();
        setIsStoreOpen(data.isStoreOpen);
      } catch (error) {
        console.error("Failed to check store status", error);
        setIsStoreOpen(true); // Fallback
      }
    };
    checkStatus();
  }, []); // <--- Empty dependency array is the magic fix here!

  // 🌟 REALTIME PUSHER
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe('store-updates');

    channel.bind('status-changed', (data: { isOpen: boolean }) => {
      console.log("⚡ Realtime Store Status Update:", data.isOpen);
      setIsStoreOpen(data.isOpen);
      router.refresh(); 
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('store-updates');
      pusher.disconnect();
    };
  }, [router]);

  if (pathname.startsWith('/admin') || pathname === '/login') {
    return <>{children}</>;
  }

  if (isStoreOpen === null) {
     return <div className="h-screen w-full flex items-center justify-center bg-white"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (isStoreOpen) {
    return <>{children}</>;
  }

  if (isAuthLoading) {
      return <div className="h-screen w-full flex items-center justify-center bg-white"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (user && user.role === 'admin') {
      return (
        <>
            <div className="bg-red-500 text-white text-xs font-bold text-center py-1 px-4 fixed top-0 left-0 right-0 z-">
                STORE IS CURRENTLY CLOSED FOR CUSTOMERS (Admin Mode)
            </div>
            {children}
        </>
      );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-100">
        <div className="h-24 w-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
          <Store className="h-10 w-10 text-red-400" />
          <div className="absolute -bottom-1 -right-1 bg-red-500 text-white p-2 rounded-full border-4 border-white">
            <Lock className="h-4 w-4" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold font-headline text-gray-800 mb-2">We are Closed!</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Sorry, Bumba's Kitchen is currently not accepting orders. We are preparing something delicious for you. Please check back later!
        </p>

        <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-600 bg-gray-100 py-3 rounded-xl">
                <Clock className="h-4 w-4" /> Usually opens at 11:00 AM
            </div>
            
            <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="w-full rounded-xl border-primary/20 hover:text-primary hover:bg-primary/5 mt-4"
            >
                Refresh Status
            </Button>
        </div>
      </div>
      
      <div className="mt-8 text-xs text-gray-400">
        Owner? <Link href="/login" className="underline hover:text-primary">Login here</Link>
      </div>
    </div>
  );
}