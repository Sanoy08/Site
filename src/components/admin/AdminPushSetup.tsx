"use client";

import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { FCM } from '@capacitor-community/fcm';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner'; // Tomar project e sonner install ache dekhlam

export default function AdminPushSetup() {
  useEffect(() => {
    const setupPushNotifications = async () => {
      // Sudhu Android/iOS app e chalabe, web e noy
      if (Capacitor.getPlatform() !== 'web') {
        
        // Notification permission check koro
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive === 'granted') {
          // Firebase er sathe device register koro
          await PushNotifications.register();

          // Register successful hole token pabe
          PushNotifications.addListener('registration', async (token) => {
            console.log('Admin Push Token:', token.value);
            
            // Sobcheye important: Admin topic e subscribe kora
            try {
              await FCM.subscribeTo({ topic: 'admin_alerts' });
              console.log('Subscribed to admin_alerts topic!');
            } catch (err) {
              console.error('FCM topic subscription error', err);
            }
          });

          // App khola thaka obosthay kono notification asle
          PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push received:', notification);
            // Kono notun order asle ba alert asle toast dekhao
            toast.success(notification.title || "New Alert", {
              description: notification.body || "Please check the admin panel.",
              duration: 5000,
            });
          });

          // Notification e tap korle ki hobe
          PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            console.log('Push action performed:', action);
            // Chaile specific kono page e redirect korte paro
          });

        } else {
          console.log('Push notification permission denied');
        }
      }
    };

    setupPushNotifications();

    // Cleanup listeners when component unmounts
    return () => {
      if (Capacitor.getPlatform() !== 'web') {
        PushNotifications.removeAllListeners();
      }
    };
  }, []);

  return null; // Ei component theke UI te kichu dekhabar nei
}