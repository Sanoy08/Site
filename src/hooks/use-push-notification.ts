// src/hooks/use-push-notification.ts

import { useEffect } from 'react';
import { PushNotifications, ActionPerformed } from '@capacitor/push-notifications';
import { FCM } from '@capacitor-community/fcm';
import { Capacitor } from '@capacitor/core';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export const usePushNotification = () => {
  const router = useRouter();
  const { user, token } = useAuth(); 

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const init = async () => {
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }
      if (permStatus.receive !== 'granted') return;

      await PushNotifications.register();

      // ★★★ FIX: (PushNotifications as any) ব্যবহার করা হয়েছে যাতে লাল দাগ না আসে ★★★
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
    PushNotifications.addListener('registration', async (fcmToken) => {
      console.log('FCM Token:', fcmToken.value);
      
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

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received:', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      const data = notification.notification.data;
      const actionId = notification.actionId;

      if (actionId === 'view' && data?.url) {
        router.push(data.url);
      } else if (data?.url) {
        router.push(data.url);
      }
    });

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [user, token, router]);
};