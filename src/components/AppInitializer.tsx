// src/components/AppInitializer.tsx

'use client';

import { useEffect } from 'react';
import { usePushNotification } from '@/hooks/use-push-notification';
import { useBackButton } from '@/hooks/use-back-button';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export function AppInitializer() {
  // হুকগুলো কল করা হচ্ছে
  usePushNotification();
  useBackButton();

  useEffect(() => {
    const configureStatusBar = async () => {
      // শুধুমাত্র মোবাইল অ্যাপে রান করবে
      if (Capacitor.isNativePlatform()) {
        try {
          // ১. স্ট্যাটাস বার অ্যাপের কন্টেন্টের ওপর ভাসবে না (Overlap বন্ধ করা)
          await StatusBar.setOverlaysWebView({ overlay: false });

          // ২. স্ট্যাটাস বারের ব্যাকগ্রাউন্ড কালার সাদা করা
          await StatusBar.setBackgroundColor({ color: '#ffffff' });

          // ৩. স্ট্যাটাস বারের আইকনগুলো কালো (Dark) করা
          await StatusBar.setStyle({ style: Style.Light });
        } catch (e) {
          console.error("Status bar config error:", e);
        }
      }
    };

    configureStatusBar();
  }, []);

  return null; 
}