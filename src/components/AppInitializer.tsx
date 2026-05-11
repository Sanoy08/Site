// src/components/AppInitializer.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePushNotification } from '@/hooks/use-push-notification';
import { useBackButton } from '@/hooks/use-back-button';
import { SplashScreen } from '@capacitor/splash-screen';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export function AppInitializer() {
  usePushNotification();
  useBackButton();

  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const checkAppMode = async () => {
        try {
          const { value } = await Preferences.get({ key: 'app_mode' });
          const currentUrl = window.location.href;

          if (value === 'admin' && !currentUrl.includes('admin.bumbaskitchen.app')) {
            window.location.href = 'https://admin.bumbaskitchen.app';
          }
        } catch (e) {}
      };
      checkAppMode();
    }

    const initNetwork = async () => {
      const status = await Network.getStatus();
      setIsOffline(!status.connected);
      
      // ★ স্প্ল্যাশ স্ক্রিন খুব দ্রুত হাইড হবে যাতে Lottie অ্যানিমেশন শুরু হতে পারে
      setTimeout(async () => {
        try {
          await SplashScreen.hide();
        } catch (e) {}
      }, 100); // 100ms 
    };

    initNetwork();

    let networkListener: any;
    const setupListener = async () => {
      networkListener = await Network.addListener('networkStatusChange', (status) => {
        setIsOffline(!status.connected);
      });
    };

    setupListener();

    const handleContextMenu = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      if (networkListener) {
        networkListener.remove();
      }
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  if (isOffline) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="w-full max-w-sm text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center shadow-inner">
            <img src="/LOGO.png" alt="Logo" className="w-16 h-16 object-contain grayscale opacity-50" />
          </div>
          
          <h1 className="text-xl font-bold text-gray-900 mb-2 font-headline">You're Offline</h1>
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