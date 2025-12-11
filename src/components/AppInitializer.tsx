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

    // ১. ব্যাক বাটন হ্যান্ডেল করা
    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp();
      } else {
        window.history.back();
      }
    });

    // ২. স্ট্যাটাস বার সেটআপ (সবচেয়ে জরুরি)
    const setupStatusBar = async () => {
      try {
        // অ্যাপকে ফুল স্ক্রিন করা (যাতে Safe Area কাজ করে)
        await StatusBar.setOverlaysWebView({ overlay: true });
        
        // স্ট্যাটাস বারের লেখা কালো করা (ব্যাটারি, সময়)
        await StatusBar.setStyle({ style: Style.Light });

        // অ্যান্ড্রয়েডে স্ট্যাটাস বার স্বচ্ছ করা
        if (Capacitor.getPlatform() === 'android') {
            await StatusBar.setBackgroundColor({ color: '#00000000' });
        }
      } catch (error) {
        console.error('Status bar setup failed:', error);
      }
    };

    setupStatusBar();

    return () => {
      App.removeAllListeners();
    };
  }, []);

  return null;
}