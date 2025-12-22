'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';

export default function Template({ children }: { children: React.ReactNode }) {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    // চেক করা হচ্ছে অ্যাপটি নেটিভ (Android/iOS) কিনা
    if (Capacitor.isNativePlatform()) {
      setIsNative(true);
    }
  }, []);

  // যদি ওয়েবসাইট হয়, তবে নরমাল রেন্ডার হবে (কোনো অ্যানিমেশন ছাড়া)
  if (!isNative) {
    return <>{children}</>;
  }

  // যদি অ্যাপ হয়, তবে "Slide Left" অ্যানিমেশন হবে
  return (
    <motion.div
      initial={{ x: '100%' }} // পেজটি ডানদিকে স্ক্রিনের বাইরে থাকবে
      animate={{ x: 0 }}      // স্লাইড করে মাঝখানে আসবে
      exit={{ x: '-50%' }}    // পুরোনো পেজটি বামে সরে যাবে
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8 // স্মুথ ফিলিংস
      }}
      className="bg-background min-h-screen w-full shadow-2xl absolute top-0 left-0"
    >
      {children}
    </motion.div>
  );
}