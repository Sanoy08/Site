// src/components/GlobalLoader.tsx

'use client';

import { useEffect, useState, memo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DotLottiePlayer } from '@dotlottie/react-player';

// ★ ল্যাগ ফিক্স ১: Memoized Player
const OptimizedLottie = memo(({ src, loop, className }: { src: string, loop: boolean, className?: string }) => (
  <DotLottiePlayer
      src={src}
      autoplay
      loop={loop}
      className={className} // ★ Custom class allow kora holo size baranor jonno
  />
));
OptimizedLottie.displayName = 'OptimizedLottie';

export default function GlobalLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isAppLaunching, setIsAppLaunching] = useState(true);

  // ★ র‍্যাম ক্যাশিং এর জন্য
  const [launchSrc, setLaunchSrc] = useState<string>('/Food Market App Interaction.lottie');
  const [loaderSrc, setLoaderSrc] = useState<string>('/Food Courier.lottie');

  // ★ ব্ল্যাঙ্ক স্ক্রিন দূর করার জন্য মাউন্ট স্টেট
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true); // কম্পোনেন্ট মাউন্ট হতেই ট্রু হবে যাতে দ্রুত রেন্ডার হয়
    
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

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setSrcCallback(objectUrl);
      } catch (error) {
        console.error("Lottie Caching Failed:", error);
      }
    };

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

  // ★ ব্ল্যাঙ্ক স্ক্রিন রোধ করতে মাউন্ট না হওয়া পর্যন্ত পুরো ব্যাকগ্রাউন্ড কালার দিয়ে ঢেকে রাখা
  if (!isMounted && isAppLaunching) {
     return <div className="fixed inset-0 z-[99999] bg-[#F8F9FA] touch-none"></div>;
  }

  return (
    <AnimatePresence>
      {/* ★ ১. অ্যাপ লঞ্চ অ্যানিমেশন ★ */}
      {isAppLaunching && (
        <motion.div 
          key="launch-animation"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          // padding-top (pt) দিয়ে একটু নিচে নামানো হয়েছে
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#F8F9FA] touch-none pt-12" 
        >
          {/* ★ সাইজ বাড়ানো হয়েছে (w-96 h-96 = 384px) এবং scale-110 দিয়ে আরও একটু জুম করা হয়েছে ★ */}
          <div className="relative w-96 h-96 scale-110"> 
            <OptimizedLottie src={launchSrc} loop={true} className="w-full h-full object-contain" />
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