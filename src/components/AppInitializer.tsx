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

    const initStatusBar = async () => {
      try {
        // ১. অ্যাপকে ফুল স্ক্রিন করা
        await StatusBar.setOverlaysWebView({ overlay: true });
        
        // ২. আইকন কালো রাখা (লাইট স্টাইল)
        await StatusBar.setStyle({ style: Style.Light });
        
        // ৩. অ্যান্ড্রয়েডে স্ট্যাটাস বার ট্রান্সপারেন্ট করা
        if (Capacitor.getPlatform() === 'android') {
          await StatusBar.setBackgroundColor({ color: '#00000000' });
        }
      } catch (e) {
        console.warn('Status bar error:', e);
      }
    };

    initStatusBar();

    return () => {
      App.removeAllListeners();
    };
  }, []);

  return null;
}