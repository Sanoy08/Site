'use client';

import { useEffect } from 'react';
import { StatusBar } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export default function StatusBarLogic() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const makeFullScreen = async () => {
        try {
          await StatusBar.setOverlaysWebView({ overlay: true });
          await StatusBar.hide();
        } catch (e) {
          console.error("Fullscreen styling failed", e);
        }
      };
      makeFullScreen();
    }
  }, []);

  return null;
}