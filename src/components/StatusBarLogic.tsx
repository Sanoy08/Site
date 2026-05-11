// src/components/StatusBarLogic.tsx

'use client';

import { useEffect } from 'react';
import { StatusBar } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export default function StatusBarLogic() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const makeFullScreen = async () => {
        try {
          // ১. অ্যাপটিকে স্ক্রিনের একদম এজ-টু-এজ (Edge-to-Edge) করা
          await StatusBar.setOverlaysWebView({ overlay: true });

          // ২. স্ট্যাটাস বার পুরোপুরি হাইড (Hide) করে দেওয়া
          await StatusBar.hide();
          
        } catch (e) {
          console.error("Fullscreen styling failed", e);
        }
      };

      makeFullScreen();
    }
  }, []);

  return null;
}