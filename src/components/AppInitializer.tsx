// src/components/AppInitializer.tsx

'use client';

import { useEffect } from 'react';
import { usePushNotification } from '@/hooks/use-push-notification';
import { useBackButton } from '@/hooks/use-back-button';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function AppInitializer() {
  const { login } = useAuth();
  const router = useRouter();

  // Initialize existing hooks
  usePushNotification();
  useBackButton();

  useEffect(() => {
    // Listener for Deep Links (Custom URL Scheme)
    const setupAppListener = async () => {
      App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
        const url = new URL(event.url);
        
        // Check if this is the Google Callback URL
        if (url.protocol.includes('bumbaskitchen') && url.pathname.includes('google-callback')) {
          
          const token = url.searchParams.get('token');
          const userStr = url.searchParams.get('user');

          if (token && userStr) {
            try {
              const user = JSON.parse(decodeURIComponent(userStr));
              // Login via useAuth
              login(user, decodeURIComponent(token));
              
              toast.success(`Welcome back, ${user.name}!`);
              router.push('/');
              router.refresh();
            } catch (error) {
              console.error("Deep link parsing error:", error);
              toast.error("Failed to process login.");
            }
          }
        }
      });
    };

    setupAppListener();

    // Cleanup listener on unmount
    return () => {
        App.removeAllListeners();
    };
  }, [login, router]);

  return null; 
}