// src/hooks/use-push-notification.ts

import { useState, useEffect, useCallback } from 'react';
import { PushNotifications, ActionPerformed } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { FCM } from '@capacitor-community/fcm';
import { Capacitor } from '@capacitor/core';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export const usePushNotification = () => {
  const router = useRouter();
  const { user, token } = useAuth();
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkPermission = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const status = await PushNotifications.checkPermissions();
      setIsSubscribed(status.receive === 'granted');
    } catch (e) {
      console.error('Error checking permissions:', e);
    }
  }, []);

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

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const init = async () => {
      await checkPermission();
      
      const status = await PushNotifications.checkPermissions();
      if (status.receive === 'granted') {
          await PushNotifications.register();
      }

      // ★★★ ফিক্স: পপ-আপ (Heads-up) এর জন্য হাই ইম্পর্টেন্স চ্যানেল তৈরি ★★★
      if (Capacitor.getPlatform() === 'android') {
        await PushNotifications.createChannel({
          id: 'pop_notifications', // এই আইডি মনে রাখবেন, সার্ভারে লাগবে
          name: 'Popup Notifications',
          description: 'High priority notifications',
          importance: 5, // 5 = Max Importance (Pops up on screen)
          visibility: 1, // 1 = Public (Show on lock screen)
          lights: true,
          vibration: true,
          sound: 'default'
        });
      }

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

    const registrationListener = PushNotifications.addListener('registration', async (fcmToken) => {
      console.log('FCM Token:', fcmToken.value);
      setIsSubscribed(true);
      
      try {
          await FCM.subscribeTo({ topic: 'all_users' });
          if(user?.role === 'admin') await FCM.subscribeTo({ topic: 'admin_updates' });
      } catch(e) { console.error('Topic sub failed', e); }

      if (token) {
        try {
            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: fcmToken.value, jwtToken: token }),
            });
        } catch (e) { console.error("Token sync failed", e); }
      }
    });

    // ★ অ্যাপ খোলা থাকলে ম্যানুয়ালি পপ-আপ দেখানো
    const notificationListener = PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('Push received in foreground:', notification);
      
      const imageUrl = notification.data?.image || notification.data?.imageUrl || notification.data?.picture;

      await LocalNotifications.schedule({
        notifications: [
          {
            title: notification.title || "New Notification",
            body: notification.body || "",
            id: new Date().getTime(),
            schedule: { at: new Date(Date.now() + 100) },
            sound: "default",
            attachments: imageUrl ? [{ id: 'image', url: imageUrl }] : [],
            extra: notification.data,
            smallIcon: "ic_stat_icon",
            channelId: 'pop_notifications', // লোকাল নোটিফিকেশনেও একই চ্যানেল ব্যবহার করছি
            actionTypeId: "ORDER_UPDATE"
          }
        ]
      });
    });

    const actionListener = PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      const data = notification.notification.data;
      if (data?.url) {
        router.push(data.url);
      }
    });

    const localActionListener = LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        const data = notification.notification.extra;
        if (data?.url) {
            router.push(data.url);
        }
    });

    return () => {
      registrationListener.then(l => l.remove());
      notificationListener.then(l => l.remove());
      actionListener.then(l => l.remove());
      localActionListener.then(l => l.remove());
    };
  }, [user, token, router, checkPermission]);

  return { 
    isSubscribed, 
    isLoading, 
    subscribeToPush 
  };
};