// src/hooks/use-push-notification.ts

import { useState, useEffect, useCallback } from 'react';
import { PushNotifications, ActionPerformed } from '@capacitor/push-notifications';
import { FCM } from '@capacitor-community/fcm';
import { Capacitor } from '@capacitor/core';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export const usePushNotification = () => {
  const router = useRouter();
  const { user, token } = useAuth();
  
  // State for UI components
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Check Permission Status
  const checkPermission = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      const status = await PushNotifications.checkPermissions();
      setIsSubscribed(status.receive === 'granted');
    } catch (e) {
      console.error('Error checking permissions:', e);
    }
  }, []);

  // 2. Request Permission (Manually triggered by button)
  const subscribeToPush = async () => {
    if (!Capacitor.isNativePlatform()) return;
    setIsLoading(true);
    
    try {
      let permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }
      
      if (permStatus.receive === 'granted') {
        await PushNotifications.register();
        setIsSubscribed(true);
        toast.success("Notifications enabled!");
      } else {
        toast.error("Permission denied. Please enable from settings.");
      }
    } catch (e) {
      console.error("Subscription failed:", e);
      toast.error("Failed to enable notifications.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Initial Setup & Listeners (Auto-run on mount)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const init = async () => {
      await checkPermission();
      
      // Auto-register logic is handled here (optional: only if already granted)
      const status = await PushNotifications.checkPermissions();
      if (status.receive === 'granted') {
          await PushNotifications.register();
      }

      // Fix for Action Types (TypeScript workaround)
      try {
        await (PushNotifications as any).registerActionTypes({
            types: [
            {
                id: 'ORDER_UPDATE',
                actions: [
                { id: 'view', title: 'View Order', foreground: true },
                { id: 'dismiss', title: 'Dismiss', destructive: true },
                ],
            },
            ]
        });
      } catch (err) {
          console.warn("Action types registration failed", err);
      }
      
      await PushNotifications.removeAllDeliveredNotifications();
    };

    init();

    // Listeners
    const registrationListener = PushNotifications.addListener('registration', async (fcmToken) => {
      console.log('FCM Token:', fcmToken.value);
      setIsSubscribed(true);
      
      try {
          await FCM.subscribeTo({ topic: 'all_users' });
          if(user?.role === 'admin') await FCM.subscribeTo({ topic: 'admin_updates' });
      } catch(e) { console.error('Topic sub failed', e); }

      if (token) {
        await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: fcmToken.value, jwtToken: token }),
        });
      }
    });

    const notificationListener = PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received:', notification);
    });

    const actionListener = PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      const data = notification.notification.data;
      const actionId = notification.actionId;

      if (actionId === 'view' && data?.url) {
        router.push(data.url);
      } else if (data?.url) {
        router.push(data.url);
      }
    });

    return () => {
      registrationListener.then(l => l.remove());
      notificationListener.then(l => l.remove());
      actionListener.then(l => l.remove());
    };
  }, [user, token, router, checkPermission]);

  // ★ Return values so NotificationPermission.tsx doesn't crash
  return { 
    isSubscribed, 
    isLoading, 
    subscribeToPush 
  };
};  