'use client';

import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { usePathname } from 'next/navigation';

export default function StatusBarLogic() {
  const pathname = usePathname();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const updateStatusBar = async () => {
        try {
          // স্ট্যাটাস বার সাদা করা
          await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
          // আইকন ডার্ক করা (Style.Light মানে লাইট ব্যাকগ্রাউন্ডের জন্য উপযুক্ত ডার্ক আইকন)
          await StatusBar.setStyle({ style: Style.Light });
          // ওভারলে বন্ধ রাখা যাতে হিরো ইমেজ ধাক্কা না দেয়
          await StatusBar.setOverlaysWebView({ overlay: false });
        } catch (e) {
          console.error("Status bar error", e);
        }
      };

      updateStatusBar();
    }
  }, [pathname]); // পাথ চেঞ্জ হলেও সাদা থাকবে

  return null;
}