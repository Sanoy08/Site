'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { useEffect, useState } from 'react';

export default function NativeTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    // চেক করা হচ্ছে এটি অ্যাপ নাকি ওয়েবসাইট
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  // ওয়েবসাইট হলে কোনো অ্যানিমেশন ছাড়াই পেজ দেখাবে
  if (!isNative) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname} // পাথ পাল্টালে অ্যানিমেশন ট্রিগার হবে
        initial={{ x: '100%' }} // নতুন পেজ ডানদিক থেকে আসবে
        animate={{ x: 0 }}      // মাঝখানে আসবে
        exit={{ x: '-20%', opacity: 0.5 }} // পুরোনো পেজ হালকা বামে সরে ফেড হবে
        transition={{
          duration: 0.3,       // ০.৩ সেকেন্ড (ফাস্ট)
          ease: "easeInOut"    // স্মুথ গতি
        }}
        style={{
          // এই স্টাইলগুলো পেজকে ফিক্সড পজিশনে রেখে স্মুথ স্লাইড নিশ্চিত করে
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflowY: 'auto', // স্ক্রলিং চালু রাখা
          backgroundColor: 'var(--background)',
          zIndex: 50,
          willChange: 'transform' // GPU ব্যবহার করে ল্যাগ কমাবে
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}