'use client';

import { useEffect } from 'react';
import { usePushNotification } from '@/hooks/use-push-notification';
import { useBackButton } from '@/hooks/use-back-button';
// ১. প্লাগিন ইম্পোর্ট করুন
import { SplashScreen } from '@capacitor/splash-screen'; 

export function AppInitializer() {
  // আপনার বর্তমান হুকগুলো
  usePushNotification();
  useBackButton();

  // ২. অ্যাপ লোড হওয়ার পর স্প্ল্যাশ স্ক্রিন হাইড করার লজিক
  useEffect(() => {
    const hideSplash = async () => {
      // সেফটির জন্য ৫০০ms অপেক্ষা, যাতে অ্যাপ রেন্ডার হতে সময় পায়
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