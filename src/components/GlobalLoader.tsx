// src/components/GlobalLoader.tsx

'use client';

import { useEffect, useState, memo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DotLottiePlayer } from '@dotlottie/react-player';

// ★ ল্যাগ ফিক্স ১: Memoized Player (যাতে State Change হলে বারবার রি-রেন্ডার না হয়)
const OptimizedLottie = memo(({ src, loop }: { src: string, loop: boolean }) => (
  <DotLottiePlayer
      src={src}
      autoplay
      loop={loop}
  />
));
OptimizedLottie.displayName = 'OptimizedLottie';

export default function GlobalLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isAppLaunching, setIsAppLaunching] = useState(true);

  // ★ ল্যাগ ফিক্স ২: RAM Caching State
  const [launchSrc, setLaunchSrc] = useState<string>('/Food Market App Interaction.lottie');
  const [loaderSrc, setLoaderSrc] = useState<string>('/Food Courier.lottie');

  // ★ Capacitor App এর জন্য Caching লজিক
  useEffect(() => {
    const prefetchAndCacheLottie = async (url: string, setSrcCallback: (src: string) => void) => {
      try {
        const cacheName = 'bumbas-lottie-cache-v1';
        const cache = await caches.open(cacheName);
        let response = await cache.match(url);

        if (!response) {
          response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response.clone());
          }
        }

        // Blob URL এ কনভার্ট করা হচ্ছে (Phone Storage এর বদলে সরাসরি RAM থেকে প্লে হবে)
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setSrcCallback(objectUrl);
      } catch (error) {
        console.error("Lottie Caching Failed:", error);
      }
    };

    // অ্যাপ লোড হওয়ার সাথে সাথেই ব্যাকগ্রাউন্ডে ক্যাশ করে নেবে
    prefetchAndCacheLottie('/Food Market App Interaction.lottie', setLaunchSrc);
    prefetchAndCacheLottie('/Food Courier.lottie', setLoaderSrc);
  }, []);

  // Launch Screen Hide Logic
  useEffect(() => {
    const hideLaunchScreen = () => {
      setTimeout(() => {
        setIsAppLaunching(false);
      }, 2500); 
    };

    if (document.readyState === 'complete') {
      hideLaunchScreen();
    } else {
      window.addEventListener('load', hideLaunchScreen);
      const fallbackTimer = setTimeout(() => setIsAppLaunching(false), 4000);
      return () => {
        window.removeEventListener('load', hideLaunchScreen);
        clearTimeout(fallbackTimer);
      };
    }
  }, []);

  // Route Change Logic
  useEffect(() => {
    setIsLoading(false);
    document.body.classList.remove('overflow-hidden');
  }, [pathname, searchParams]);

  // Click Listener Logic
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
      {/* ★ ১. অ্যাপ লঞ্চ অ্যানিমেশন (Off-white Background) ★ */}
      {isAppLaunching && (
        <motion.div 
          key="launch-animation"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#F8F9FA] touch-none"
        >
          <div className="relative w-80 h-80"> 
            <OptimizedLottie src={launchSrc} loop={true} />
          </div>
        </motion.div>
      )}

      {/* ★ ২. নরমাল পেজ লোডিং অ্যানিমেশন ★ */}
      {!isAppLaunching && isLoading && (
        <motion.div 
          key="page-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm touch-none"
        >
          <div className="relative w-48 h-48 mb-2"> 
            <OptimizedLottie src={loaderSrc} loop={true} />
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <p className="text-sm font-bold text-[#7D9A4D] animate-pulse uppercase tracking-widest">
              Please Wait...
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}