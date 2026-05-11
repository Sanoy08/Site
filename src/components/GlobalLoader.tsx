// src/components/GlobalLoader.tsx

'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DotLottiePlayer } from '@dotlottie/react-player';

export default function GlobalLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  
  // ★ অ্যাপ লঞ্চের অ্যানিমেশনের স্টেট
  const [isAppLaunching, setIsAppLaunching] = useState(true);

  // অ্যাপ ওপেন হওয়ার পর মিনিমাম 2.5 সেকেন্ড এবং পুরোপুরি লোড হওয়া পর্যন্ত অ্যানিমেশন দেখাবে
  useEffect(() => {
    const hideLaunchScreen = () => {
      // একটু সময় দেওয়া হলো যাতে অ্যানিমেশনটা ইউজার ভালোভাবে দেখতে পারে
      setTimeout(() => {
        setIsAppLaunching(false);
      }, 2500); 
    };

    // যদি অলরেডি লোড হয়ে গিয়ে থাকে
    if (document.readyState === 'complete') {
      hideLaunchScreen();
    } else {
      // পুরো পেজ এবং রিসোর্স লোড হওয়ার জন্য অপেক্ষা করবে
      window.addEventListener('load', hideLaunchScreen);
      
      // ফলব্যাক: কোনো কারণে লোড ইভেন্ট ফায়ার না হলে ৪ সেকেন্ড পর হাইড হয়ে যাবে
      const fallbackTimer = setTimeout(() => setIsAppLaunching(false), 4000);
      
      return () => {
        window.removeEventListener('load', hideLaunchScreen);
        clearTimeout(fallbackTimer);
      };
    }
  }, []);

  // রাউটিংয়ের সময় লোডার বন্ধ করার জন্য
  useEffect(() => {
    setIsLoading(false);
    document.body.classList.remove('overflow-hidden');
  }, [pathname, searchParams]);

  // লিংকে ক্লিক করলে লোডার দেখানোর জন্য
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
          // গ্রিন ব্যাকগ্রাউন্ডের বদলে হালকা অফ-হোয়াইট (#F8F9FA) দেওয়া হলো
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#F8F9FA] touch-none"
        >
          <div className="relative w-80 h-80"> 
            <DotLottiePlayer
                src="/Food Market App Interaction.lottie"
                autoplay
                loop={true} // ★ যতক্ষণ লোডিং চলবে, লটি অ্যানিমেশনটা ঘুরতে থাকবে
            />
          </div>
        </motion.div>
      )}

      {/* ★ ২. নরমাল পেজ লোডিং অ্যানিমেশন (Food Courier.lottie) ★ */}
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
            <DotLottiePlayer
                src="/Food Courier.lottie"
                autoplay
                loop
            />
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