'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

export default function SafeAreaController() {
  const pathname = usePathname();
  const [isSafe, setIsSafe] = useState(false);

  useEffect(() => {
    // শুধুমাত্র নেটিভ অ্যাপ (Android/iOS) হলে এই লজিক কাজ করবে, ব্রাউজারে নয়
    if (Capacitor.isNativePlatform()) {
      // হোমপেজ ('/') ছাড়া অন্য সব পেজে সেফ-এরিয়া অন হবে
      setIsSafe(pathname !== '/');
    }
  }, [pathname]);

  if (!isSafe) return null;

  return (
    <>
      {/* ১. স্ট্যাটাস বারের নিচে একটা সলিড ব্যাকগ্রাউন্ড ব্লক 
          (যাতে অন্য পেজগুলোতে টাইম এবং ব্যাটারি আইকনগুলো ক্লিয়ারলি দেখা যায়) */}
      <div 
        className="fixed top-0 left-0 right-0 z-[99999] bg-background transition-all duration-300" 
        style={{ height: 'env(safe-area-inset-top, 45px)' }} 
      />
      
      {/* ২. গ্লোবাল ম্যাজিক CSS: 
          এটা কোনো ফাইলে হাত না দিয়েই পুরো বডি এবং Fixed হেডারগুলোকে সেফ-এরিয়া বা ৪৫ পিক্সেল নিচে নামিয়ে দেবে */}
      <style dangerouslySetInnerHTML={{__html: `
        body {
          padding-top: env(safe-area-inset-top, 45px) !important;
        }
        /* অ্যাপের হেডার যদি fixed থাকে, সেটাকেও নিচে নামাতে হবে */
        header, .fixed.top-0, .sticky.top-0 {
          top: env(safe-area-inset-top, 45px) !important;
        }
      `}} />
    </>
  );
}