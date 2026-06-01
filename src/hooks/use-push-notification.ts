// src/hooks/use-push-notification.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { PushNotifications, ActionPerformed } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { FCM } from '@capacitor-community/fcm';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app'; 
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export const usePushNotification = () => {
  const router = useRouter();
  const { user } = useAuth(); 
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // ★ FIX: Prevent duplicate API calls for the same token
  const syncedTokenRef = useRef<string | null>(null);

  const handleNavigation = useCallback((url: string) => {
    if (!url) return;
    if (url.startsWith('http') || url.startsWith('https')) {
        window.location.href = url;
    } else {
        router.push(url);
    }
  }, [router]);

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

        await PushNotifications.createChannel({
          id: 'user_notifications', 
          name: 'User Alerts', 
          description: 'General notifications for users',
          importance: 5, 
          visibility: 1, 
          lights: true,
          vibration: true,
          sound: 'user_alert'
        });
      }

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
      console.log('FCM Token Registered:', fcmToken.value);
      setIsSubscribed(true);

      // ★ FIX: Prevent spamming backend with the exact same token over and over
      if (syncedTokenRef.current === fcmToken.value) {
          return; 
      }
      
      let currentAppId = 'com.bumbaskitchen.app'; 

      try {
          const appInfo = await App.getInfo();
          currentAppId = appInfo.id; 
          const isAdminApp = currentAppId === 'com.bumbaskitchen.admin';

          if (isAdminApp) {
              await FCM.subscribeTo({ topic: 'admin_updates' });
              try { await FCM.unsubscribeFrom({ topic: 'all_users' }); } catch(e) {}
          } else {
              await FCM.subscribeTo({ topic: 'all_users' });
              try { await FCM.unsubscribeFrom({ topic: 'admin_updates' }); } catch(e) {}
          }
      } catch(e) { 
          console.error('Topic sub failed', e); 
      }

      try {
        await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              token: fcmToken.value,
              appId: currentAppId 
            }), 
        });
        
        // ★ FIX: Save token in ref so we don't send it again in this session
        syncedTokenRef.current = fcmToken.value;
        console.log("FCM Token synced with server");
      } catch (e) { 
        console.error("Token sync failed", e); 
      }
    });

    const notificationListener = PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('Push received in foreground:', notification);
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notification-updated'));
      }

      const imageUrl = notification.data?.image || notification.data?.imageUrl || notification.data?.picture;
      const channelId = notification.data?.android_channel_id || 'user_notifications'; 
      let soundName = channelId === 'admin_order_alert' ? 'my_alert' : 'user_alert';

      await LocalNotifications.schedule({
        notifications: [
          {
            title: notification.title || "New Notification",
            body: notification.body || "",
            id: Math.floor(Math.random() * 2147483647),
            schedule: { at: new Date(Date.now() + 100) },
            sound: soundName,
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
  // ★ FIX: Removed 'router' from dependencies. It was causing the useEffect to re-run on EVERY page change!
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, checkPermission, handleNavigation]); 

  return { 
    isSubscribed, 
    isLoading, 
    subscribeToPush 
  };
};