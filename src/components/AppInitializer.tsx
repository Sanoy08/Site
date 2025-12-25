// src/components/AppInitializer.tsx

'use client';

import { useEffect } from 'react';
import { usePushNotification } from '@/hooks/use-push-notification';
import { useBackButton } from '@/hooks/use-back-button';
import { SplashScreen } from '@capacitor/splash-screen';

export function AppInitializer() {
  usePushNotification();
  useBackButton();

  // ১. অ্যাপ লোড হওয়ার পর স্প্ল্যাশ স্ক্রিন সরানোর কোড (আপনার এক্সিস্টিং)
  useEffect(() => {
    const hideSplash = async () => {
      // একটু সময় দিন (500ms) যাতে অ্যাপ রেন্ডার হতে পারে
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        await SplashScreen.hide();
      } catch (e) {
        console.error('Error hiding splash screen:', e);
      }
    };

    hideSplash();
  }, []);

  // ২. ★★★ DISABLE CONTEXT MENU (নতুন যুক্ত করা হয়েছে) ★★★
  // এটি ইনপুট ফিল্ড সহ সব জায়গায় লং প্রেস মেনু আসা বন্ধ করবে
  useEffect(() => {
    const handleContextMenu = (e: Event) => {
      e.preventDefault(); // ডিফল্ট মেনু পপ-আপ বন্ধ করে
      return false;
    };

    // পুরো অ্যাপে ইভেন্ট লিসেনার বসানো হলো
    document.addEventListener('contextmenu', handleContextMenu);

    // ক্লিনআপ ফাংশন
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return null; 
}