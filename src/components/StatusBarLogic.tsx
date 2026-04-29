'use client';

import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export default function StatusBarLogic() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const initStatusBar = async () => {
        try {
          // ১. প্রথমে ওভারলে বন্ধ করা (সেফটি)
          await StatusBar.setOverlaysWebView({ overlay: false });

          // ২. রঙ পরিবর্তন: সবুজ -> সাদা
          await StatusBar.setBackgroundColor({ color: '#FFFFFF' });

          // ৩. আইকন পরিবর্তন: সাদা -> কালো
          // Style.Light মানে হলো "ব্যাকগ্রাউন্ড লাইট", তাই আইকন হবে ডার্ক (কালো)
          await StatusBar.setStyle({ style: Style.Light });
          
        } catch (e) {
          console.error("Status bar styling failed", e);
        }
      };

      // অ্যাপ লোড হওয়ার সাথে সাথে কল হবে
      initStatusBar();
    }
  }, []);

  return null;
}