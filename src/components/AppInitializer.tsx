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
    // শুধুমাত্র নেটিভ অ্যাপে (Android/iOS) রান করবে
    if (Capacitor.isNativePlatform()) {
      const configureStatusBar = async () => {
        try {
          // ১. স্ট্যাটাস বারের আইকনগুলো কালো (Dark) হবে কারণ ব্যাকগ্রাউন্ড সাদা
          await StatusBar.setStyle({ style: Style.Light }); 
          
          // ২. অ্যান্ড্রয়েডের জন্য স্ট্যাটাস বারের ব্যাকগ্রাউন্ড কালার সাদা করে দেওয়া
          if (Capacitor.getPlatform() === 'android') {
            await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
            
            // ৩. ওভারলে বন্ধ রাখা (যাতে কন্টেন্ট স্ট্যাটাস বারের নিচে না ঢুকে যায়)
            // তবে আমরা CSS দিয়ে padding হ্যান্ডেল করছি, তাই এটি false রাখাই সেফ
            await StatusBar.setOverlaysWebView({ overlay: false });
          }
        } catch (e) {
          console.error('Error configuring status bar:', e);
        }
      };

      configureStatusBar();
    }
  }, []);

  return null; 
}