'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, UtensilsCrossed, ShoppingBag, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/menus', label: 'Menu', icon: UtensilsCrossed },
  { href: '/cart', label: 'Cart', icon: ShoppingBag },
  { href: '/account', label: 'Account', icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const [shouldHide, setShouldHide] = useState(false);

  useEffect(() => {
    // ১. যদি সাবডোমেইন 'admin' হয়
    if (window.location.hostname.startsWith('admin')) {
        setShouldHide(true);
    }
  }, []);

  // ২. যদি URL পাথ '/admin' দিয়ে শুরু হয় (Localhost বা পাথ-বেসড রাউটিংয়ের জন্য)
  // অথবা সাবডোমেইন চেক ট্রু হয়
  if (pathname.startsWith('/admin') || shouldHide) {
      return null;
  }

  return (
    <div className="md:hidden fixed bottom-6 left-0 right-0 z-[100] flex justify-center px-6 pointer-events-none">
      <nav className="relative flex items-center justify-around w-full max-w-[400px] h-[68px] bg-white/80 backdrop-blur-2xl border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[24px] px-2 pointer-events-auto overflow-hidden">
        
        {navLinks.map((link) => {
          const isActive = link.href === '/' 
            ? pathname === '/' 
            : pathname.startsWith(link.href);

          return (
            <Link 
              key={link.href} 
              href={link.href} 
              className="relative flex flex-col items-center justify-center w-full h-full group"
            >
              {/* --- Background Slide Animation --- */}
              {isActive && (
                <motion.div 
                  layoutId="nav-indicator"
                  className="absolute inset-1.5 bg-primary/10 rounded-[18px] z-0"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}

              {/* --- Icon & Label Container --- */}
              <div className={cn(
                "relative z-10 flex flex-col items-center transition-all duration-300",
                isActive ? "scale-110 -translate-y-0.5" : "scale-100"
              )}>
                <link.icon 
                  className={cn(
                    "h-[22px] w-[22px] transition-colors duration-300", 
                    isActive ? "text-primary stroke-[2.5px]" : "text-gray-400 group-active:text-gray-600"
                  )} 
                />
                
                <span className={cn(
                  "text-[10px] mt-1 font-bold tracking-tight transition-colors duration-300",
                  isActive ? "text-primary" : "text-gray-400"
                )}>
                  {link.label}
                </span>
              </div>

              {/* --- Active Glow Dot --- */}
              {isActive && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute bottom-1.5 h-1 w-1 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.8)]"
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}