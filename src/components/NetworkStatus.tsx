// src/components/NetworkStatus.tsx
'use client';

import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // শুরুতে চেক করা হচ্ছে
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    // ইভেন্ট লিসেনার সেট করা হচ্ছে
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  if (isOnline) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="bg-red-50 p-6 rounded-full mb-6 relative">
        <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-20"></div>
        <WifiOff className="w-16 h-16 text-red-500 relative z-10" />
      </div>
      
      <h2 className="text-2xl font-bold text-slate-800 mb-2 font-headline">No Internet Connection</h2>
      <p className="text-slate-500 mb-8 max-w-xs leading-relaxed">
        It seems you are offline. Please check your internet connection and try again.
      </p>
      
      <Button 
        onClick={handleRetry}
        className="bg-slate-900 text-white px-8 py-6 rounded-xl font-semibold shadow-lg shadow-slate-200 hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-3"
      >
        <RefreshCw className="w-5 h-5" />
        Try Again
      </Button>
    </div>
  );
}