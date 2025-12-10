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

    const fixStatusBar = async () => {
      try {
        // ★ ১. Overlay চালু করুন (যাতে CSS Safe Area কাজ করে)
        await StatusBar.setOverlaysWebView({ overlay: true });

        // ★ ২. স্ট্যাটাস বারের রঙ পরিবর্তন করুন (সাদা)
        // নোট: Overlay true থাকলে backgroundColor কাজ নাও করতে পারে, তাই আমরা স্টাইল সেট করবো
        await StatusBar.setStyle({ style: Style.Light });
        
        // Android এর জন্য স্ট্যাটাস বার ট্রান্সপারেন্ট করে দিন (যাতে সাদা ব্যাকগ্রাউন্ডের সাথে মিশে যায়)
        if (Capacitor.getPlatform() === 'android') {
           // স্ট্যাটাস বার ট্রান্সপারেন্ট হলে দেখতে সুন্দর লাগবে
           await StatusBar.setBackgroundColor({ color: '#00000000' }); 
        }
      } catch (error) {
        console.warn('Status bar configuration failed:', error);
      }
    };

    fixStatusBar();

    return () => {
      App.removeAllListeners();
    };
  }, []);

  return null;
}