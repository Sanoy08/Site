// src/components/StatusBarLogic.tsx
'use client';

import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export default function StatusBarLogic() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const initStatusBar = async () => {
        try {
          // ১. অ্যাপকে নচ এরিয়া পর্যন্ত ফোর্স করা
          await StatusBar.setOverlaysWebView({ overlay: true });

          // ২. ★ স্ট্যাটাস বারের ব্যাকগ্রাউন্ড পুরোপুরি ট্রান্সপারেন্ট (স্বচ্ছ) করা ★
          await StatusBar.setBackgroundColor({ color: '#00000000' });

          // ৩. আইকনগুলো যেন বোঝা যায় তার জন্য
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