// src/components/AnimatedSplash.tsx
'use client';

import { useEffect, useState } from 'react';
import { DotLottiePlayer } from '@dotlottie/react-player'; // তোমার যদি অন্য লটি প্যাকেজ থাকে সেটা ইম্পোর্ট করবে
import Image from 'next/image';

export default function AnimatedSplash() {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // ৩ সেকেন্ড পর ফেড-আউট অ্যানিমেশন শুরু হবে
    const timer = setTimeout(() => {
      setFadeOut(true);
      // ৩.৫ সেকেন্ড পর পুরো স্ক্রিন রিমুভ হয়ে যাবে
      setTimeout(() => setShow(false), 500); 
    }, 3000); 

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#F8F9FA] transition-opacity duration-500 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* ★ তোমার লটি অ্যানিমেশন বা জিফ (GIF) এখানে দাও */}
      <div className="w-64 h-64">
         <DotLottiePlayer
           src="/Food Courier.lottie"
           autoplay
           loop
         />
      </div>

      {/* ব্র্যান্ডিং / লোগো */}
      <h1 className="mt-8 text-3xl font-bold text-primary font-pacifico animate-bounce">
        Bumba's Kitchen
      </h1>
      <p className="text-sm font-medium text-gray-500 mt-2 tracking-widest">
        DELIVERING HAPPINESS
      </p>
    </div>
  );
}
