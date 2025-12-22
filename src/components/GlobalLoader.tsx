'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function GlobalLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // পেজ লোড লজিক
  useEffect(() => {
    setIsLoading(false);
    document.body.classList.remove('overflow-hidden');
  }, [pathname, searchParams]);

  // লিংক ক্লিক লজিক
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
          key="global-loader" // অ্যানিমেশনের জন্য ইউনিক কি জরুরি
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white touch-none"
        >
          
          {/* ★★★ YOUR IMAGE HERE ★★★ */}
          <div className="relative w-48 h-48 mb-4"> 
            <Image 
              src="/images/delivery-boy.gif" 
              alt="Loading..."
              fill
              className="object-contain" 
              priority 
              unoptimized 
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