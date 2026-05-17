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
          // ১. ওভারলে TRUE করা হলো (যাতে অ্যাপ নচ এরিয়া পর্যন্ত চলে যায়)
          await StatusBar.setOverlaysWebView({ overlay: true });

          // ২. রঙ পরিবর্তন: সাদা থেকে ট্রান্সপারেন্ট (স্বচ্ছ) করা হলো
          await StatusBar.setBackgroundColor({ color: '#00000000' });

          // ৩. আইকন পরিবর্তন: কালো (ডার্ক) আইকন
          await StatusBar.setStyle({ style: Style.Light });
          
          // যদি স্ট্যাটাস বার (ব্যাটারি/টাইম) পুরোপুরি গায়েব করে দিতে চাও, 
          // তাহলে নিচের লাইনটি আনকমেন্ট করতে পারো:
          // await StatusBar.hide();

        } catch (e) {
          console.error("Status bar styling failed", e);
        }
      };

      initStatusBar();
    }
  }, []);

  return null;
}