// src/Components/StatusBarLogic.tsx

'use client';

import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export default function StatusBarLogic() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const initStatusBar = async () => {
        try {
          // ১. ওভারলে true করা হলো, এতে অ্যাপ notch area বা edge-to-edge চলে যাবে
          await StatusBar.setOverlaysWebView({ overlay: true });

          // ২. যদি স্ট্যাটাস বার পুরোপুরি লুকিয়ে ফেলতে চাও (একদম ফুলস্ক্রিন গেমের মতো), 
          // তাহলে নিচের লাইনটি আনকমেন্ট করো:
          // await StatusBar.hide();

          // ৩. আইকন পরিবর্তন: ডার্ক মোড বা লাইট মোডের উপর ভিত্তি করে টাইম বা ব্যাটারির কালার
          // (অ্যাপের ব্যাকগ্রাউন্ড লাইট হলে Style.Dark ইউজ করবে কালো আইকনের জন্য)
          await StatusBar.setStyle({ style: Style.Dark });
          
        } catch (e) {
          console.error("Status bar styling failed", e);
        }
      };

      initStatusBar();
    }
  }, []);

  return null;
}