// src/hooks/use-push-notification.ts

import { useState, useEffect, useCallback } from 'react';
import { PushNotifications, ActionPerformed } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications'; // ★ নতুন ইম্পোর্ট
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
      
      // Auto-register logic
      const status = await PushNotifications.checkPermissions();
      if (status.receive === 'granted') {
          await PushNotifications.register();
      }

      // Register Action Types (Optional)
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
      
      // পুরোনো ডেলিভার হওয়া নোটিফিকেশন ক্লিয়ার করা (অপশনাল)
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
        try {
            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: fcmToken.value, jwtToken: token }),
            });
        } catch (e) { console.error("Token sync failed", e); }
      }
    });

    // ★ ফোরগ্রাউন্ড নোটিফিকেশন হ্যান্ডলার (ছবি দেখানোর জন্য ফিক্স)
    const notificationListener = PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('Push received in foreground:', notification);
      
      // ডাটা থেকে ইমেজ লিঙ্ক বের করা (বিভিন্ন নামের হতে পারে)
      const imageUrl = notification.data?.image || notification.data?.imageUrl || notification.data?.picture;

      // লোকাল নোটিফিকেশন তৈরি করা যাতে সিস্টেম ট্রে-তে ছবিসহ আসে
      await LocalNotifications.schedule({
        notifications: [
          {
            title: notification.title || "New Notification",
            body: notification.body || "",
            id: new Date().getTime(),
            schedule: { at: new Date(Date.now() + 100) }, // ১০০ মিলি সেকেন্ড পরে দেখাবে
            sound: "default",
            attachments: imageUrl ? [{ id: 'image', url: imageUrl }] : [], // ★ এই লাইনটি ছবি দেখাবে
            extra: notification.data, // ক্লিক করলে যাতে ইউআরএল পাওয়া যায়
            smallIcon: "ic_stat_icon", // আপনার আইকন নাম (res/drawable ফোল্ডারে থাকতে হবে)
            actionTypeId: "ORDER_UPDATE"
          }
        ]
      });
    });

    // ★ ব্যাকগ্রাউন্ড নোটিফিকেশন ক্লিক হ্যান্ডলার
    const actionListener = PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      const data = notification.notification.data;
      if (data?.url) {
        router.push(data.url);
      }
    });

    // ★ লোকাল নোটিফিকেশন (ফোরগ্রাউন্ড) ক্লিক হ্যান্ডলার
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