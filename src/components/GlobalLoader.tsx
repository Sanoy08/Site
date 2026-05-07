'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// ★ Import DotLottie Player
import { DotLottiePlayer } from '@dotlottie/react-player';

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
          
          {/* ★★★ LOTTIE ANIMATION LOADER ★★★ */}
          <div className="relative w-72 h-72 mb-2"> 
            <DotLottiePlayer
                src="/lottie/Food Courier.lottie"
                autoplay
                loop
            />
          </div>

          {/* Loader Text (Bumba's Kitchen removed) */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <p className="text-base font-semibold text-muted-foreground animate-pulse">
              Your page is on the way...
            </p>
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}