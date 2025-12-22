'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
// Image import আর লাগবে না

export default function GlobalLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

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
          
          {/* ★★★ MP4 VIDEO LOADER ★★★ */}
          <div className="relative w-64 h-64 mb-4"> 
            <video
              src="/images/loader.mp4" // আপনার ভিডিও ফাইলের নাম
              autoPlay
              loop
              muted
              playsInline // মোবাইলে ফুলস্ক্রিন হওয়া আটকাবে
              className="w-full h-full object-contain pointer-events-none"
            />
          </div>

          {/* Branding Text */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
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