// src/components/AppInitializer.tsx
'use client';

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
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

    // ২. স্ট্যাটাস বার হাইড করা (Full Screen Mode)
    const hideStatusBar = async () => {
      try {
        await StatusBar.hide(); 
      } catch (error) {
        console.error('Failed to hide status bar:', error);
      }
    };

    hideStatusBar();

    return () => {
      App.removeAllListeners();
    };
  }, []);

  return null;
}