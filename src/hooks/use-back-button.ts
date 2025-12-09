import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useRouter, usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

export const useBackButton = () => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    App.addListener('backButton', ({ canGoBack }) => {
      if (pathname === '/' || pathname === '/login') {
        // Exit app if on home or login
        App.exitApp();
      } else {
        // Otherwise go back
        router.back();
      }
    });

    return () => {
      App.removeAllListeners();
    };
  }, [pathname, router]);
};