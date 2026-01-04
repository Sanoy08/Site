// src/components/AppInitializer.tsx

'use client';

import { useEffect } from 'react';
import { usePushNotification } from '@/hooks/use-push-notification';
import { useBackButton } from '@/hooks/use-back-button';
import { SplashScreen } from '@capacitor/splash-screen';
import { Network } from '@capacitor/network'; // নতুন ইম্পোর্ট
import { toast } from 'sonner';

export function AppInitializer() {
  usePushNotification();
  useBackButton();

  useEffect(() => {
    // ১. স্প্ল্যাশ স্ক্রিন হাইড
    const hideSplash = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      try {
        await SplashScreen.hide();
      } catch (e) {
        console.error('Error hiding splash screen:', e);
      }
    };
    hideSplash();

    // ২. নেটওয়ার্ক স্ট্যাটাস লিসেনার (অফলাইন হ্যান্ডেল করার জন্য)
    const setupNetworkListener = async () => {
      const status = await Network.getStatus();
      if (!status.connected) {
        toast.error("You are currently offline. Some features may not work.", {
          duration: Infinity, // ইউজার অনলাইন না হওয়া পর্যন্ত মেসেজ থাকবে
        });
      }

      Network.addListener('networkStatusChange', status => {
        if (!status.connected) {
          toast.error("Internet connection lost!");
        } else {
          toast.success("Back online!");
          // ইচ্ছে করলে উইন্ডো রিলোড দিতে পারেন যদি পেজ লোড না হয়ে থাকে
          // window.location.reload(); 
        }
      });
    };
    setupNetworkListener();

    // ৩. রাইট ক্লিক / কনটেক্সট মেনু বন্ধ
    const handleContextMenu = (e: Event) => {
      e.preventDefault();
      return false;
    };
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return null; 
}