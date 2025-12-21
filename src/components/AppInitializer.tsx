// src/components/AppInitializer.tsx

'use client';

import { useEffect } from 'react';
import { usePushNotification } from '@/hooks/use-push-notification';
import { useBackButton } from '@/hooks/use-back-button';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export function AppInitializer() {
  usePushNotification();
  useBackButton();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const configureStatusBar = async () => {
        try {
          // ১. স্টাইল লাইট (কালো লেখা)
          await StatusBar.setStyle({ style: Style.Light }); 
          
          if (Capacitor.getPlatform() === 'android') {
            // ২. ব্যাকগ্রাউন্ড সাদা
            await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
            
            // ৩. ★★★ ফিক্স: ওভারলে বন্ধ করে দেওয়া ★★★
            // এর ফলে এন্ড্রয়েডে স্ট্যাটাস বার আলাদা থাকবে, অ্যাপের কন্টেন্ট তার নিচ থেকে শুরু হবে।
            // স্ক্রল করলে স্ট্যাটাস বার নড়বে না।
            await StatusBar.setOverlaysWebView({ overlay: false });
          }
        } catch (e) {
          console.error('Error configuring status bar:', e);
        }
      };

      configureStatusBar();
    }
  }, []);

  return null; 
}