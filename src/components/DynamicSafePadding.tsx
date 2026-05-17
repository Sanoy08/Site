'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function DynamicSafePadding() {
  const pathname = usePathname();

  useEffect(() => {
    // যদি হোমপেজ হয়, তাহলে সেফ-প্যাডিং রিমুভ করবো (পুরো ফুলস্ক্রিন থাকবে)
    if (pathname === '/') {
      document.documentElement.classList.remove('safe-padding-active');
    } else {
      // অন্য পেজ হলে সেফ-প্যাডিং অ্যাড করবো (স্ট্যাটাস বারের ব্যাকগ্রাউন্ড আসবে)
      document.documentElement.classList.add('safe-padding-active');
    }
  }, [pathname]);

  return null;
}