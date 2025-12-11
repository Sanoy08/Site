// src/components/AppInitializer.tsx
'use client';

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { usePushNotification } from '@/hooks/use-push-notification';

export function AppInitializer() {
  usePushNotification();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp();
      } else {
        window.history.back();
      }
    });

    const init = async () => {
      try {
        // ১. অ্যাপ স্ট্যাটাস বারের নিচ পর্যন্ত বিস্তৃত হবে (Overlay)
        await StatusBar.setOverlaysWebView({ overlay: true });
        
        // ২. স্ট্যাটাস বারের আইকন কালো হবে (সাদা ব্যাকগ্রাউন্ডের জন্য)
        await StatusBar.setStyle({ style: Style.Light });
        
        // ৩. স্ট্যাটাস বার ট্রান্সপারেন্ট হবে (যাতে আমাদের CSS কালার দেখা যায়)
        if (Capacitor.getPlatform() === 'android') {
            await StatusBar.setBackgroundColor({ color: '#00000000' });
        }
      } catch (e) {
        console.error('Status bar error:', e);
      }
    };

    init();

    return () => {
      App.removeAllListeners();
    };
  }, []);

  return null;
}