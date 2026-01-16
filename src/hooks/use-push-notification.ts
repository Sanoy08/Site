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

  const handleNavigation = (url: string) => {
    if (!url) return;
    if (url.startsWith('http') || url.startsWith('https')) {
        window.location.href = url;
    } else {
        router.push(url);
    }
  };

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
        // ১. অ্যাডমিন চ্যানেল (আগের মতোই)
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

        // ২. ★ ইউজারদের জন্য নতুন কাস্টম সাউন্ড চ্যানেল ★
        await PushNotifications.createChannel({
          id: 'user_notifications', 
          name: 'User Alerts', 
          description: 'General notifications for users',
          importance: 5, 
          visibility: 1, 
          lights: true,
          vibration: true,
          sound: 'user_alert' // ★ আপনার নতুন সাউন্ড ফাইলের নাম (user_alert.mp3)
        });
      }

      // Action Types (যদি ভিউ বাটন ক্লিক করতে চান)
      try {
        await (PushNotifications as any).registerActionTypes({
            types: [{
                id: 'ORDER_UPDATE',
                actions: [
                    { id: 'view', title: 'View Order', foreground: true },
                    { id: 'dismiss', title: 'Dismiss', destructive: true },
                ],
            }]
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
      
      // ★ চ্যানেল এবং সাউন্ড ডিটেকশন লজিক আপডেট ★
      // যদি সার্ভার থেকে চ্যানেল আইডি না আসে, তবে ডিফল্ট হিসেবে 'user_notifications' ধরা হবে
      const channelId = notification.data?.android_channel_id || 'user_notifications'; 
      
      let soundName = 'user_alert'; // ডিফল্ট সাউন্ড (ইউজারদের জন্য)

      if (channelId === 'admin_order_alert') {
          soundName = 'my_alert'; // অ্যাডমিন সাউন্ড
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title: notification.title || "New Notification",
            body: notification.body || "",
            id: new Date().getTime(),
            schedule: { at: new Date(Date.now() + 100) },
            sound: soundName, // ★ সঠিক সাউন্ড ফাইল বাজবে
            attachments: imageUrl ? [{ id: 'image', url: imageUrl }] : [],
            extra: notification.data,
            smallIcon: "ic_stat_icon",
            channelId: channelId,
            actionTypeId: "ORDER_UPDATE"
          }
        ]
      });
    });

    const actionListener = PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      const data = notification.notification.data;
      if (data?.url) {
        handleNavigation(data.url);
      }
    });

    const localActionListener = LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        const data = notification.notification.extra;
        if (data?.url) {
            handleNavigation(data.url);
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