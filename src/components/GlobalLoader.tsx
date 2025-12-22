'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { CookingPot } from 'lucide-react'; // নতুন কিচেন আইকন

export default function GlobalLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // ১. পেজ চেঞ্জ কমপ্লিট হলে লোডার বন্ধ হবে এবং স্ক্রল চালু হবে
  useEffect(() => {
    setIsLoading(false);
    // স্ক্রল লক খোলার জন্য বডি থেকে ক্লাস সরানো হচ্ছে
    document.body.classList.remove('overflow-hidden');
  }, [pathname, searchParams]);

  // ২. লিংকে ক্লিক করলেই লোডার চালু হবে এবং স্ক্রল বন্ধ হবে
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      // যদি ভ্যালিড ইন্টারনাল লিংক হয় এবং অন্য পেজে যায়
      if (
        anchor &&
        anchor.href &&
        anchor.href.startsWith(window.location.origin) &&
        !anchor.target &&
        !anchor.getAttribute('download') &&
        anchor.pathname !== window.location.pathname
      ) {
        setIsLoading(true);
        // স্ক্রল বন্ধ করার জন্য বডিতে Tailwind ক্লাস যোগ করা হচ্ছে
        document.body.classList.add('overflow-hidden');
      }
    };

    document.addEventListener('click', handleAnchorClick);
    
    // ক্লিনআপ: কম্পোনেন্ট আনমাউন্ট হলে স্ক্রল যেন আটকে না থাকে
    return () => {
      document.removeEventListener('click', handleAnchorClick);
      document.body.classList.remove('overflow-hidden');
    };
  }, []);

  if (!isLoading) return null;

  return (
    // ব্যাকগ্রাউন্ড একটু বেশি সাদা এবং ব্লার করা হয়েছে যাতে পেছনের কন্টেন্ট কম দেখা যায়
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 backdrop-blur-md transition-all duration-300 overscroll-none touch-none">
      
      <div className="relative flex flex-col items-center text-center p-6 rounded-2xl">
        
        {/* অ্যানিমেটেড কিচেন আইকন */}
        <div className="relative mb-4">
          {/* পেছনের হালকা গ্লো ইফেক্ট */}
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
          
          {/* মূল আইকন - বাউন্স অ্যানিমেশন */}
          <CookingPot 
            className="h-20 w-20 text-primary animate-bounce relative z-10 drop-shadow-lg" 
            strokeWidth={1.5}
          />
          
          {/* ধোঁয়া/স্টিম ইফেক্ট (অপশনাল, ছোট ডট দিয়ে বোঝানো) */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary/40 rounded-full animate-ping delay-75"></div>
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary/30 rounded-full animate-ping delay-150"></div>
        </div>

        {/* ব্র্যান্ডিং টেক্সট */}
        <h2 className="text-2xl font-bold font-headline text-primary mb-2 tracking-wide">
          Bumba's Kitchen
        </h2>
        
        {/* সাবটাইটেল */}
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Preparing deliciousness...
        </p>
      </div>
    </div>
  );
}