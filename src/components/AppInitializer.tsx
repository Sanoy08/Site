// src/components/AppInitializer.tsx

'use client';

import { useEffect } from 'react';
import { usePushNotification } from '@/hooks/use-push-notification';
import { useBackButton } from '@/hooks/use-back-button';
import { App as CapacitorApp, URLOpenListenerEvent } from '@capacitor/app'; // নাম পরিবর্তন করা হয়েছে সংঘর্ষ এড়াতে
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function AppInitializer() {
  const { login } = useAuth();
  const router = useRouter();

  // হুকগুলো কল করা হচ্ছে
  usePushNotification();
  useBackButton();

  useEffect(() => {
    // Listener for Deep Links (Custom URL Scheme)
    const setupAppListener = async () => {
      CapacitorApp.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
        // ইভেন্ট ইউআরএল লগ করা হচ্ছে ডিবাগিংয়ের জন্য
        console.log("Deep link triggered:", event.url); 
        
        try {
            const url = new URL(event.url);
            
            // ★★★ FIX: Host অথবা Pathname চেক করা হচ্ছে ★★★
            // bumbaskitchen://google-callback এর ক্ষেত্রে 'google-callback' হলো host
            const isGoogleCallback = 
                url.protocol.includes('bumbaskitchen') && 
                (url.host.includes('google-callback') || url.pathname.includes('google-callback'));

            if (isGoogleCallback) {
              
              const token = url.searchParams.get('token');
              const userStr = url.searchParams.get('user');

              if (token && userStr) {
                  const user = JSON.parse(decodeURIComponent(userStr));
                  
                  // লগইন ফাংশন কল করা
                  login(user, decodeURIComponent(token));
                  
                  toast.success(`Welcome back, ${user.name}!`);
                  
                  // লগইন শেষে হোমপেজে রিডাইরেক্ট
                  router.push('/');
                  router.refresh();
              } else {
                  console.error("Token or User data missing in deep link");
              }
            }
        } catch (error) {
            console.error("Deep link parsing error:", error);
        }
      });
    };

    setupAppListener();

    // ক্লিনআপ
    return () => {
        CapacitorApp.removeAllListeners();
    };
  }, [login, router]);

  return null; 
}