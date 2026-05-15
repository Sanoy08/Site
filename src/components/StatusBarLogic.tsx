// src/Components/StatusBarLogic.tsx

'use client';

import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export default function StatusBarLogic() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const initStatusBar = async () => {
        try {

          await StatusBar.setOverlaysWebView({ overlay: true });

          await StatusBar.setStyle({ style: Style.Dark });
          
        } catch (e) {
          console.error("Status bar styling failed", e);
        }
      };

      initStatusBar();
    }
  }, []);

  return null;
}