// src/components/AppInitializer.tsx

'use client';

import { useEffect } from 'react';
import { usePushNotification } from '@/hooks/use-push-notification';
import { useBackButton } from '@/hooks/use-back-button';
import { App as CapacitorApp, URLOpenListenerEvent } from '@capacitor/app';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function AppInitializer() {
  const { login } = useAuth();
  const router = useRouter();

  usePushNotification();
  useBackButton();

  useEffect(() => {
    
    // Login Handling Logic
    const handleDeepLink = (urlStr: string) => {
        // Debug Toast (Only for testing, remove later)
        // toast.info(`Received: ${urlStr}`); 
        console.log('Deep Link:', urlStr);

        try {
            const url = new URL(urlStr);

            // Check specifically for google-callback (host or path)
            const isGoogleCallback = url.href.includes('google-callback');

            if (isGoogleCallback) {
                const error = url.searchParams.get('error');
                if (error) {
                    toast.error(`Login Failed: ${decodeURIComponent(error)}`);
                    router.push('/login');
                    return;
                }

                const token = url.searchParams.get('token');
                const userStr = url.searchParams.get('user');

                if (token && userStr) {
                    const user = JSON.parse(decodeURIComponent(userStr));
                    login(user, decodeURIComponent(token));
                    
                    toast.success(`Welcome back, ${user.name}!`);
                    router.push('/');
                    router.refresh();
                }
            }
        } catch (e) {
            console.error("Deep link error", e);
        }
    };

    // 1. Check if app was launched with a URL (Cold Start)
    CapacitorApp.getLaunchUrl().then((launchUrl) => {
        if (launchUrl && launchUrl.url) {
            handleDeepLink(launchUrl.url);
        }
    });

    // 2. Listen for future URL opens (Resume)
    const listener = CapacitorApp.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
        handleDeepLink(event.url);
    });

    return () => {
        listener.then(handle => handle.remove());
    };
  }, [login, router]);

  return null; 
}