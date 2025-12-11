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

    // ব্যাক বাটন হ্যান্ডেলিং
    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp();
      } else {
        window.history.back();
      }
    });

    // ★ ফিক্স ৪: স্ট্যাটাস বার কনফিগারেশন
    const initStatusBar = async () => {
      try {
        // ১. Overlay চালু (যাতে CSS Safe Area কাজ করে)
        await StatusBar.setOverlaysWebView({ overlay: true });
        
        // ২. আইকন কালো (সাদা ব্যাকগ্রাউন্ডের জন্য)
        await StatusBar.setStyle({ style: Style.Light });
        
        // ৩. ব্যাকগ্রাউন্ড ট্রান্সপারেন্ট (অ্যান্ড্রয়েডে)
        if (Capacitor.getPlatform() === 'android') {
          await StatusBar.setBackgroundColor({ color: '#00000000' });
        }
      } catch (e) {
        console.warn('Status bar setup failed', e);
      }
    };

    initStatusBar();

    return () => {
      App.removeAllListeners();
    };
  }, []);

  return null;
}