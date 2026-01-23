// src/app/delivery/layout.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, Home, User, MapPin, Bike, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth'; // ★★★ useAuth

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // ★★★ useAuth হুক ব্যবহার করা হচ্ছে (এটি ইতিমধ্যেই সেশন চেক করে)
  const { user, isLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // লোডিং শেষ হলে চেক শুরু
    if (!isLoading) {
      if (!user) {
        // লগইন না থাকলে
        router.replace('/login');
      } else if (user.role === 'admin' || user.role === 'delivery') {
        // পারমিশন আছে
        setIsAuthorized(true);
      } else {
        // লগইন আছে কিন্তু রোল কাস্টমার
        toast.error("Unauthorized Access!");
        router.replace('/');
      }
    }
  }, [user, isLoading, router]);

  // যতক্ষণ লোডিং বা চেকিং চলছে
  if (isLoading || (!isAuthorized && user)) { // ইউজার আছে কিন্তু অথরাইজড হয়নি এমন অবস্থায় রেন্ডার বন্ধ
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-slate-500 text-sm font-medium">Verifying Partner Access...</p>
      </div>
    );
  }

  // যদি অথরাইজড না হয়, কিছুই রেন্ডার করবেন না (রিডাইরেক্ট হবে)
  if (!isAuthorized) {
    return null;
  }

  // ★ শুধুমাত্র অথরাইজড হলেই নিচের অংশ রেন্ডার হবে ★
  const navItems = [
    { href: '/delivery', icon: Home, label: 'Dispatch' },
    { href: '/delivery/history', icon: MapPin, label: 'Trips' },
    { href: '/delivery/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 md:pb-0">
      
      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-white/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 shadow-sm border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-blue-200 shadow-md">
                <Bike className="w-5 h-5 text-white" />
            </div>
            <div>
                <h1 className="font-bold text-slate-800 leading-tight">Partner App</h1>
                <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Online</span>
                </div>
            </div>
        </div>
        <button className="relative p-2 hover:bg-slate-100 rounded-full transition-colors">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1.5 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>
      </div>

      <main className="max-w-md mx-auto md:mt-6 md:border md:rounded-3xl md:shadow-2xl md:bg-white md:min-h-[800px] md:overflow-hidden md:relative">
          {children}
          
          {/* Mobile Bottom Navigation */}
          <div className="lg:hidden fixed bottom-6 left-4 right-4 bg-slate-900/90 backdrop-blur-xl text-white rounded-2xl p-2 shadow-2xl z-50 flex justify-around items-center border border-white/10">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link 
                    key={item.href} 
                    href={item.href} 
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-white text-slate-900 font-bold shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && <span className="text-xs">{item.label}</span>}
                </Link>
              );
            })}
          </div>
      </main>

      {/* Desktop Warning */}
      <div className="hidden lg:flex fixed bottom-4 right-4 bg-white p-4 rounded-xl shadow-lg border text-xs text-slate-500 max-w-xs">
          <p>💡 This interface is optimized for mobile devices.</p>
      </div>
    </div>
  );
}