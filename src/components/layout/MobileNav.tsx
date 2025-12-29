'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Utensils, ShoppingCart, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/menus', label: 'Menu', icon: Utensils },
  { href: '/cart', label: 'Cart', icon: ShoppingCart },
  { href: '/account', label: 'Account', icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const [shouldHide, setShouldHide] = useState(false);

  useEffect(() => {
    // ১. যদি সাবডোমেইন 'admin' হয়
    const isAdminDomain = window.location.hostname.includes('admin');
    
    // ২. অথবা যদি লিংকের পাথে '/admin' থাকে
    const isAdminPath = pathname.startsWith('/admin');

    if (isAdminDomain || isAdminPath) {
      setShouldHide(true);
    } else {
      setShouldHide(false);
    }
  }, [pathname]);

  // যদি এডমিন পেজ হয়, তাহলে কিচ্ছু দেখাবে না
  if (shouldHide) return null;

  return (
    <div className="md:hidden fixed bottom-2 left-0 right-0 z-50 flex justify-center">
      <div className="w-[92%] max-w-md rounded-2xl bg-card border border-border shadow-lg px-1 py-1.5">
        <nav className="flex justify-between items-center">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== '/' && pathname.startsWith(link.href));

            const Icon = link.icon;

            return (
              <Link key={link.href} href={link.href} className="flex-1 flex justify-center">
                <div
                  className={cn(
                    'flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all duration-300',
                    isActive
                      ? 'bg-primary/10 -translate-y-1'
                      : 'text-muted-foreground'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  <span
                    className={cn(
                      'text-[10px] font-medium leading-none',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {link.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}