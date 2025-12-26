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

      if (Capacitor.getPlatform() === 'android') {
        
        // ★★★ FIX 1: Channel ID v3 (Fresh Start) ★★★
        const channelId = 'pop_notifications_v3';

        // 1. Push Plugin দিয়ে চ্যানেল তৈরি
        await PushNotifications.createChannel({
          id: channelId,
          name: 'General Alerts',
          description: 'General notifications with sound',
          importance: 5, // MAX Importance (Heads-up এর জন্য জরুরি)
          visibility: 1, 
          lights: true,
          vibration: true,
          sound: 'default'
        });

        // 2. ★★★ FIX 2: LocalNotifications দিয়েও চ্যানেল তৈরি ★★★
        // অ্যাপ খোলা থাকলে পপ-আপ দেখানোর দায়িত্ব এর, তাই এর কাছেও চ্যানেলটি থাকা চাই
        try {
            await LocalNotifications.createChannel({
                id: channelId,
                name: 'General Alerts',
                description: 'General notifications with sound',
                importance: 5,
                visibility: 1,
                lights: true,
                vibration: true,
                sound: 'default'
            });
        } catch (e) { console.error("Local channel create failed", e); }

        // Admin Channel
        await PushNotifications.createChannel({
          id: 'admin_order_alert', 
          name: 'Admin Order Alerts',
          description: 'Alerts for new orders with custom sound',
          importance: 5,
          visibility: 1,
          lights: true,
          vibration: true,
          sound: 'my_alert'
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

    const notificationListener = PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('Push received in foreground:', notification);
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notification-updated'));
      }

      const imageUrl = notification.data?.image || notification.data?.imageUrl || notification.data?.picture;
      let channelId = notification.data?.android_channel_id;
      
      // চ্যানেল রিডাইরেক্ট (v3 তে)
      if (!channelId || channelId === 'pop_notifications' || channelId === 'pop_notifications_v2') {
          channelId = 'pop_notifications_v3';
      }

      const soundName = channelId === 'admin_order_alert' ? 'my_alert' : 'default';

      // ★★★ FIX 3: Priority & Tiny Delay ★★★
      await LocalNotifications.schedule({
        notifications: [
          {
            title: notification.title || "New Notification",
            body: notification.body || "",
            id: new Date().getTime(),
            // একদম ১০০ মিলিসেকেন্ড ডিলে দেওয়া হলো। এটি সাউন্ডে দেরি করবে না, 
            // কিন্তু অ্যান্ড্রয়েড UI কে পপ-আপ অ্যানিমেশন রেন্ডার করার সময় দেবে।
            schedule: { at: new Date(Date.now() + 100) }, 
            sound: soundName,
            attachments: imageUrl ? [{ id: 'image', url: imageUrl }] : [],
            extra: notification.data,
            smallIcon: "ic_stat_icon",
            channelId: channelId, 
            actionTypeId: "ORDER_UPDATE",
            // Priority সেট করা হলো (যদিও এটি টাইপস্ক্রিপ্টে এরর দেখাতে পারে, কিন্তু রানটাইমে কাজ করে)
            // @ts-ignore 
            priority: 2 
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