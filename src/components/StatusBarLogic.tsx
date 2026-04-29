"use client";

import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { usePathname } from 'next/navigation';

export default function StatusBarLogic() {
  const pathname = usePathname();

  useEffect(() => {
    const initStatusBar = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // ১. স্ট্যাটাস বারকে ওয়েবভিউয়ের উপর ওভারল্যাপ করানো
          await StatusBar.setOverlaysWebView({ overlay: true });
          
          // ২. ব্যাকগ্রাউন্ড পুরোপুরি ট্রান্সপারেন্ট করা
          await StatusBar.setBackgroundColor({ color: '#00000000' });
          
          // ৩. আইকনগুলো ডার্ক মোডে রাখা (যাতে সাদা স্ক্রলে দেখা যায়)
          await StatusBar.setStyle({ style: Style.Light });
        } catch (error) {
          console.error('Status Bar Error:', error);
        }
      }
    };

    initStatusBar();
  }, [pathname]);

  return null;
}