// src/app/delivery/layout.tsx



'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Home, History, User, Bike } from 'lucide-react';
// import { Toaster } from 'sonner'; // <--- এটা বাদ দিন

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // ★ আপডেট: সাধারণ লগইনে না পাঠিয়ে ডেলিভারি লগইনে পাঠানো
        router.replace('/delivery/login'); 
      } else if (user.role !== 'delivery' && user.role !== 'admin') {
        // যদি কাস্টমার ঢোকার চেষ্টা করে
        router.replace('/'); 
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 gap-4">
            <div className="p-4 bg-white rounded-full shadow-lg animate-bounce">
                <Bike className="w-8 h-8 text-primary" />
            </div>
            <Loader2 className="animate-spin text-muted-foreground" />
        </div>
    );
  }

  const navItems = [
    { href: '/delivery', icon: Home, label: 'Dispatch' },
    { href: '/delivery/history', icon: History, label: 'History' },
    { href: '/delivery/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      {/* Top Bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 sticky top-0 z-30 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-lg">
                <Bike className="w-5 h-5 text-primary" />
            </div>
            <h1 className="font-bold text-lg text-slate-800">Partner App</h1>
        </div>
        <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-xs font-bold text-green-700">Online</span>
        </div>
      </div>

      <main className="p-4 max-w-md mx-auto">{children}</main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 pb-safe z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link 
                key={item.href} 
                href={item.href} 
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${isActive ? 'text-primary bg-primary/5' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "animate-in zoom-in-50 duration-200" : ""} />
              <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
      
      {/* <Toaster /> <--- এখান থেকে রিমুভ করা হয়েছে কারণ মেইন লেআউটে অলরেডি আছে */}
    </div>
  );
}