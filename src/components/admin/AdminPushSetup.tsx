// src/components/admin/AdminPushSetup.tsx

"use client";

import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { FCM } from '@capacitor-community/fcm';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app'; // ★ নতুন ইমপোর্ট করা হলো
import { toast } from 'sonner';

export default function AdminPushSetup() {
  useEffect(() => {
    const setupPushNotifications = async () => {
      // শুধু Android/iOS অ্যাপে চালাবে, web-এ নয়
      if (Capacitor.getPlatform() !== 'web') {
        
        // Notification permission check 
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive === 'granted') {
          await PushNotifications.register();

          // ১. অ্যান্ড্রয়েডের জন্য কাস্টম সাউন্ড চ্যানেল তৈরি করা
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
          }

          // Register successful হলে token পাবে
          PushNotifications.addListener('registration', async (token) => {
            console.log('Admin Push Token:', token.value);
            
            // ★ ১. Topic নাম admin_updates করা হলো
            try {
              await FCM.subscribeTo({ topic: 'admin_updates' });
              console.log('Subscribed to admin_updates topic!');
            } catch (err) {
              console.error('FCM topic subscription error', err);
            }

            // ★ ২. Admin App-এর টোকেন এবং App ID সার্ভারে সেভ করা হলো
            try {
              const appInfo = await App.getInfo();
              await fetch('/api/notifications/subscribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    token: token.value,
                    appId: appInfo.id || 'com.bumbaskitchen.admin' // Admin App ID
                  }), 
              });
              console.log("Admin FCM Token synced with server");
            } catch (e) { 
              console.error("Admin Token sync failed", e); 
            }
          });

          // অ্যাপ খোলা থাকা অবস্থায় কোনো নোটিফিকেশন আসলে (Foreground)
          PushNotifications.addListener('pushNotificationReceived', async (notification) => {
            console.log('Push received:', notification);
            
            // Toast দেখানো
            toast.success(notification.title || "New Alert", {
              description: notification.body || "Please check the admin panel.",
              duration: 5000,
            });

            // ফোরগ্রাউন্ডে নোটিফিকেশন ব্যানার ও কাস্টম সাউন্ড বাজানো
            await LocalNotifications.schedule({
              notifications: [
                {
                  title: notification.title || "New Alert",
                  body: notification.body || "",
                  id: new Date().getTime(), 
                  schedule: { at: new Date(Date.now() + 100) }, 
                  sound: 'my_alert', 
                  smallIcon: "ic_stat_icon",
                  channelId: 'admin_order_alert', 
                }
              ]
            });
          });

          // নোটিফিকেশনে ট্যাপ করলে কী হবে
          PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            console.log('Push action performed:', action);
          });

        } else {
          console.log('Push notification permission denied');
        }
      }
    };

    setupPushNotifications();

    // Cleanup listeners
    return () => {
      if (Capacitor.getPlatform() !== 'web') {
        PushNotifications.removeAllListeners();
      }
    };
  }, []);

  return null;
}