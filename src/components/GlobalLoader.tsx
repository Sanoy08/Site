'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function GlobalLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // ১. পেজ চেঞ্জ কমপ্লিট হলে লোডার বন্ধ হবে
  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams]);

  // ২. লিংকে ক্লিক করলেই লোডার চালু হবে
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      // যদি ভ্যালিড ইন্টারনাল লিংক হয়
      if (
        anchor &&
        anchor.href &&
        anchor.href.startsWith(window.location.origin) &&
        !anchor.target &&
        !anchor.getAttribute('download')
      ) {
        // যদি একই পেজে ক্লিক না করে অন্য পেজে যায়
        if (anchor.pathname !== window.location.pathname) {
          setIsLoading(true);
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm transition-all duration-300">
      
      {/* অ্যানিমেটেড লোগো অথবা স্পিনার */}
      <div className="relative flex flex-col items-center gap-6">
        
        {/* অপশনাল: আপনার লোগো মাঝখানে দেখাতে চাইলে */}
        <div className="relative w-20 h-20 mb-4 animate-bounce">
           <Image src="/LOGO.png" alt="Logo" fill className="object-contain" />
        </div>

        {/* প্রিমিয়াম স্পিনার */}
        <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Loader2 className="h-8 w-8 text-primary animate-pulse" />
            </div>
        </div>

        <p className="text-lg font-semibold text-primary animate-pulse">
          Please wait...
        </p>
      </div>
    </div>
  );
}