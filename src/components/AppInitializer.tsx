'use client';

import { useEffect } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';
import { usePushNotification } from '@/hooks/use-push-notification';
import { useBackButton } from '@/hooks/use-back-button';

export function AppInitializer() {
  // আপনার আগের হুকগুলো
  usePushNotification();
  useBackButton();

  // ★ নতুন: স্প্ল্যাশ স্ক্রিন হাইড করার লজিক
  useEffect(() => {
    const hideSplash = async () => {
      // ৫০০ মিলিসেকেন্ড অপেক্ষা করা হচ্ছে যাতে অ্যাপ পুরোপুরি রেন্ডার হতে সময় পায়
      // আপনি চাইলে এই সময়টা (500) বাড়াতে বা কমাতে পারেন
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // স্প্ল্যাশ স্ক্রিন সরিয়ে ফেলা
      await SplashScreen.hide();
    };

    hideSplash();
  }, []);

  return null;
}