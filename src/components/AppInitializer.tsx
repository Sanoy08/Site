'use client';

import { useEffect } from 'react';
import { usePushNotification } from '@/hooks/use-push-notification';
import { useBackButton } from '@/hooks/use-back-button';
import { SplashScreen } from '@capacitor/splash-screen'; // ১. ইম্পোর্ট করুন

export function AppInitializer() {
  usePushNotification();
  useBackButton();

  // ২. অ্যাপ লোড হওয়ার পর স্প্ল্যাশ স্ক্রিন সরানোর কোড
  useEffect(() => {
    const hideSplash = async () => {
      // একটু সময় দিন (500ms) যাতে অ্যাপ রেন্ডার হতে পারে
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        await SplashScreen.hide();
      } catch (e) {
        console.error('Error hiding splash screen:', e);
      }
    };

    hideSplash();
  }, []);

  return null; 
}