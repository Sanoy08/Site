// src/components/PageTransition.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { useEffect, useState } from 'react';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    // চেক করা হচ্ছে অ্যাপ নাকি ওয়েবসাইট
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  // যদি ওয়েবসাইট হয়, কোনো অ্যানিমেশন ছাড়াই পেজ দেখাবে
  if (!isNative) {
    return <>{children}</>;
  }

  // যদি অ্যাপ হয়, Slide Left অ্যানিমেশন দেখাবে
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ x: '100%' }}      // ডান দিক থেকে শুরু হবে
        animate={{ x: 0 }}           // মাঝখানে আসবে
        exit={{ x: '-100%' }}        // বাম দিকে চলে যাবে
        transition={{ duration: 0.3, ease: 'easeInOut' }} // স্মুথ স্পিড
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}