// src/components/AppInitializer.tsx
'use client';

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { usePushNotification } from '@/hooks/use-push-notification';

export function AppInitializer() {
  // নোটিফিকেশন হুক কল করা
  usePushNotification();

  useEffect(() => {
    // শুধুমাত্র নেটিভ অ্যাপের জন্য রান হবে
    if (!Capacitor.isNativePlatform()) return;

    // ১. ব্যাক বাটন হ্যান্ডেল করা
    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp();
      } else {
        window.history.back();
      }
    });

    // ২. স্ট্যাটাস বার কনফিগারেশন (সবচেয়ে গুরুত্বপূর্ণ পার্ট)
    const configureStatusBar = async () => {
      try {
        // অ্যাপ পুরো স্ক্রিন জুড়ে থাকবে (নচ সহ)
        await StatusBar.setOverlaysWebView({ overlay: true });
        
        // স্ট্যাটাস বারের আইকন কালো হবে (Light Style)
        await StatusBar.setStyle({ style: Style.Light });

        // অ্যান্ড্রয়েডের জন্য স্ট্যাটাস বারের ব্যাকগ্রাউন্ড ট্রান্সপারেন্ট
        // (যাতে আমাদের CSS এর সাদা রঙ দেখা যায়)
        if (Capacitor.getPlatform() === 'android') {
           await StatusBar.setBackgroundColor({ color: '#00000000' });
        }
      } catch (e) {
        console.warn('Status bar error:', e);
      }
    };

    configureStatusBar();

    return () => {
      App.removeAllListeners();
    };
  }, []);

  return null;
}