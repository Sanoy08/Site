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
          // ১. ওভারলে TRUE করতে হবে (যাতে নেটিভ Edge-to-Edge বাধা না পায়)
          await StatusBar.setOverlaysWebView({ overlay: true });

          // ২. রঙ পরিবর্তন: সাদা -> ট্রান্সপারেন্ট (স্বচ্ছ)
          // #00000000 মানে হলো পুরোপুরি স্বচ্ছ, যার ফলে পেছনের অ্যাপ কন্টেন্ট দেখা যাবে
          await StatusBar.setBackgroundColor({ color: '#00000000' });

          // ৩. আইকন পরিবর্তন: ডার্ক (কালো)
          await StatusBar.setStyle({ style: Style.Light });
          
        } catch (e) {
          console.error("Status bar styling failed", e);
        }
      };

      initStatusBar();
    }
  }, []);

  return null;
}