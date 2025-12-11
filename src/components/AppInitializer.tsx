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

    // Handle Hardware Back Button
    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp();
      } else {
        window.history.back();
      }
    });

    // ★ FIX 2: Status Bar Configuration
    const initStatusBar = async () => {
      try {
        // 1. Enable Overlay (So app takes full height)
        await StatusBar.setOverlaysWebView({ overlay: true });
        
        // 2. Set Icons to Dark (for light background)
        await StatusBar.setStyle({ style: Style.Light });
        
        // 3. Set Background to Transparent (Android Only)
        // This allows our CSS background to show through the status bar area
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