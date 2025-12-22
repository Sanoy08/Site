'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils'; // cn ইউটিলিটি ইম্পোর্ট করা হলো ক্লাস মার্জ করার জন্য

export default function GlobalLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false); // ★ নতুন স্টেট

  useEffect(() => {
    setIsLoading(false);
    document.body.classList.remove('overflow-hidden');
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (
        anchor && anchor.href && anchor.href.startsWith(window.location.origin) &&
        !anchor.target && !anchor.getAttribute('download') &&
        anchor.pathname !== window.location.pathname
      ) {
        setIsLoading(true);
        setIsVideoReady(false); // লোডিং শুরু হলে ভিডিও স্টেট রিসেট হবে
        document.body.classList.add('overflow-hidden');
      }
    };
    document.addEventListener('click', handleAnchorClick);
    return () => {
      document.removeEventListener('click', handleAnchorClick);
      document.body.classList.remove('overflow-hidden');
    };
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div 
          key="global-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white touch-none"
        >
          
          {/* ★★★ MP4 VIDEO LOADER WITH FADE-IN FIX ★★★ */}
          <div className="relative w-64 h-64 mb-4"> 
            <video
              src="/images/loader.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              // ভিডিও রেডি হলে এই ফাংশনটি কল হবে এবং ভিডিও দৃশ্যমান হবে
              onLoadedData={() => setIsVideoReady(true)}
              className={cn(
                "w-full h-full object-contain pointer-events-none transition-opacity duration-500", 
                isVideoReady ? "opacity-100" : "opacity-0" // রেডি না হওয়া পর্যন্ত ভিডিও লুকানো থাকবে
              )}
            />
          </div>

          {/* Branding Text - ভিডিও রেডি হওয়ার পরেই টেক্সট দেখাবে (অপশনাল, চাইলে সবসময় দেখাতে পারেন) */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isVideoReady ? 1 : 0, y: isVideoReady ? 0 : 10 }} // ভিডিওর সাথে সিঙ্ক করা হলো
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold font-headline text-primary tracking-wide">
              Bumba's Kitchen
            </h2>
            <p className="text-sm font-medium text-muted-foreground animate-pulse mt-1">
              Your page is on the way...
            </p>
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}