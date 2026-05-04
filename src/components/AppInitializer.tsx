// src/components/AppInitializer.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePushNotification } from '@/hooks/use-push-notification';
import { useBackButton } from '@/hooks/use-back-button';
import { useStatusBarScroll } from '@/hooks/use-statusbar-scroll';

import { SplashScreen } from '@capacitor/splash-screen';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { StatusBar, Style } from '@capacitor/status-bar';

export function AppInitializer() {
  usePushNotification();
  useBackButton();
  useStatusBarScroll(); // 🔥 scroll অনুযায়ী status bar control

  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {

    // ✅ 0. Status Bar Initial Setup (VERY IMPORTANT)
    const initStatusBar = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        // 🔥 overlay enable (must for edge-to-edge)
        await StatusBar.setOverlaysWebView({ overlay: true });

        // 🔥 initial transparent
        await StatusBar.setBackgroundColor({ color: '#00000000' });

        // 🔥 white icons (transparent bg er jonno)
        await StatusBar.setStyle({ style: Style.Dark });

      } catch (e) {
        console.error("Status bar init failed", e);
      }
    };

    initStatusBar();


    // ✅ 1. Admin App Mode Checker
    if (Capacitor.isNativePlatform()) {
      const checkAppMode = async () => {
        try {
          const { value } = await Preferences.get({ key: 'app_mode' });
          const currentUrl = window.location.href;

          if (value === 'admin' && !currentUrl.includes('admin.bumbaskitchen.app')) {
            window.location.href = 'https://admin.bumbaskitchen.app';
          }
        } catch (e) {
          console.error("Failed to check app mode", e);
        }
      };
      checkAppMode();
    }


    // ✅ 2. Initial Network Check + Splash Hide
    const initNetwork = async () => {
      const status = await Network.getStatus();
      setIsOffline(!status.connected);

      setTimeout(async () => {
        try {
          await SplashScreen.hide();
        } catch (e) {}
      }, 500);
    };

    initNetwork();


    // ✅ 3. Network Listener
    let networkListener: any;

    const setupListener = async () => {
      networkListener = await Network.addListener('networkStatusChange', (status) => {
        setIsOffline(!status.connected);
      });
    };

    setupListener();


    // ✅ 4. Disable Context Menu
    const handleContextMenu = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);


    // ✅ Cleanup
    return () => {
      if (networkListener) {
        networkListener.remove();
      }
      document.removeEventListener('contextmenu', handleContextMenu);
    };

  }, []);


  // ✅ Offline UI
  if (isOffline) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="w-full max-w-sm text-center">

          <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center shadow-inner">
            <img src="/LOGO.png" alt="Logo" className="w-16 h-16 object-contain grayscale opacity-50" />
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-2 font-headline">
            You're Offline
          </h1>

          <div className="w-12 h-1 bg-[#7D9A4D] mx-auto mb-4 rounded-full" />

          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Looks like there's no internet connection right now.
            Please reconnect to continue enjoying <strong>Bumba's Kitchen</strong>.
          </p>

          <div className="animate-pulse flex items-center justify-center gap-2 text-[#7D9A4D] font-medium text-xs">
            <div className="w-2 h-2 bg-[#7D9A4D] rounded-full" />
            Waiting for connection...
          </div>

        </div>
      </div>
    );
  }

  return null;
}