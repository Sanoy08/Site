// src/app/(shop)/notifications/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Bell, Loader2, Clock, ExternalLink, BellOff, BellRing } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import { PLACEHOLDER_IMAGE_URL } from '@/lib/constants';
import { optimizeImageUrl } from '@/lib/imageUtils';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import Pusher from 'pusher-js'; // ★ Pusher ইমপোর্ট (যদি ইনস্টল না থাকে: npm install pusher-js)

type Notification = {
  _id: string;
  title: string;
  message: string;
  image?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Settings State
  const [isNotifEnabled, setIsNotifEnabled] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('default');

  const router = useRouter();

  // 1. Check Permission Status
  const checkNotificationStatus = async () => {
    const userPref = localStorage.getItem('app_notification_enabled');
    let osStatus = 'default';

    if (Capacitor.isNativePlatform()) {
      const perm = await PushNotifications.checkPermissions();
      osStatus = perm.receive;
    } else if ('Notification' in window) {
      osStatus = Notification.permission;
    }

    setPermissionStatus(osStatus);

    if (userPref === 'false') {
        setIsNotifEnabled(false);
    } else if (userPref === 'true') {
        setIsNotifEnabled(true);
    } else {
        setIsNotifEnabled(osStatus === 'granted');
    }
  };

  // 2. Handle Toggle
  const handleToggleNotification = async (checked: boolean) => {
    if (checked) {
      if (permissionStatus === 'denied') {
        toast.error("Notifications are blocked!", {
          description: "Please enable them from your phone Settings.",
        });
        return; 
      }

      try {
        let granted = false;
        if (Capacitor.isNativePlatform()) {
          const result = await PushNotifications.requestPermissions();
          if (result.receive === 'granted') {
            await PushNotifications.register(); 
            granted = true;
          }
        } else {
          const result = await Notification.requestPermission();
          if (result === 'granted') granted = true;
        }

        if (granted) {
          localStorage.setItem('app_notification_enabled', 'true');
          localStorage.removeItem('notification-rejected');
          setIsNotifEnabled(true);
          setPermissionStatus('granted');
          toast.success("Notifications Enabled!");
        } else {
          toast.error("Permission denied.");
          setIsNotifEnabled(false);
        }
      } catch (e) {
        console.error(e);
        setIsNotifEnabled(false);
      }

    } else {
      try {
        if (Capacitor.isNativePlatform()) {
           await PushNotifications.unregister(); 
           await PushNotifications.removeAllListeners();
        }
        localStorage.setItem('app_notification_enabled', 'false');
        setIsNotifEnabled(false);
        toast.info("Notifications Muted");
      } catch (error) {
        console.error("Error disabling:", error);
      }
    }
  };

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch('/api/notifications/history', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setNotifications(data.notifications);
    } catch (error) {
        console.error(error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  // ★★★ Real-time Listener Effect ★★★
  useEffect(() => {
    if (!user) return;

    // 1. Mobile App Realtime Listener (Foreground)
    let nativeListener: any;
    if (Capacitor.isNativePlatform()) {
        const addListener = async () => {
            // অ্যাপ খোলা থাকা অবস্থায় নোটিফিকেশন এলে এই ফাংশন কল হবে
            nativeListener = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
                console.log('Push received in foreground:', notification);
                fetchNotifications(); // লিস্ট রিফ্রেশ
                // অপশনাল: ইউজারকে ছোট টোস্ট দেখানো
                toast.info("New Notification", {
                    description: notification.title || "Check your inbox",
                    icon: <BellRing className="h-4 w-4 text-primary" />
                });
            });
        };
        addListener();
    }

    // 2. Web Realtime Listener (Pusher)
    // আপনার .env থেকে Pusher Key নেওয়া হচ্ছে
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    let pusher: Pusher | null = null;

    if (pusherKey && pusherCluster) {
        pusher = new Pusher(pusherKey, {
            cluster: pusherCluster,
        });

        // আপনার ব্যাকএন্ডে যে চ্যানেল নাম দেওয়া আছে (সাধারণত `user-{userId}` বা `notifications-{userId}`)
        // আমি ধরে নিচ্ছি 'notifications-{userId}' ফরম্যাট। যদি কাজ না করে তবে ব্যাকএন্ড চেক করবেন।
        // আপনার User ID: user.id অথবা user._id
        const userId = (user as any).id || (user as any)._id;
        const channel = pusher.subscribe(`notifications-${userId}`);

        channel.bind('new-notification', (data: any) => {
            console.log('Pusher notification received:', data);
            fetchNotifications(); // লিস্ট রিফ্রেশ
            if (!Capacitor.isNativePlatform()) {
                 toast.info("New Notification Received");
            }
        });
    }

    // Cleanup
    return () => {
        if (nativeListener) {
            nativeListener.remove();
        }
        if (pusher) {
            pusher.unbind_all();
            pusher.unsubscribe(`notifications-${(user as any).id || (user as any)._id}`);
        }
    };
  }, [user, fetchNotifications]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
        router.push('/login');
        return;
    }
    if (user) {
        fetchNotifications();
        checkNotificationStatus();
    }
    
    // ম্যানুয়াল ইভেন্ট লিসেনার (যদি অন্য কম্পোনেন্ট থেকে ট্রিগার হয়)
    const handleUpdate = () => fetchNotifications();
    window.addEventListener('notification-updated', handleUpdate);
    
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
             checkNotificationStatus();
             fetchNotifications(); // অ্যাপে ফিরে আসলে রিফ্রেশ
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
        window.removeEventListener('notification-updated', handleUpdate);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };

  }, [user, isAuthLoading, router, fetchNotifications]);

  const formatTimeAgo = (dateString: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
  };

  if (isAuthLoading || isLoading) {
      return <div className="flex justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container max-w-2xl py-6 min-h-screen space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" /> Notifications
        </h1>
      </div>

      {/* Settings Toggle Card */}
      <Card className="p-4 bg-secondary/20 border-secondary/20 shadow-none">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isNotifEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {isNotifEnabled ? <BellRing className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                </div>
                <div>
                    <h3 className="font-semibold text-sm text-foreground">Push Notifications</h3>
                    <p className="text-xs text-muted-foreground">
                        {isNotifEnabled ? "Receive updates on orders & offers" : "Notifications are currently paused"}
                    </p>
                </div>
            </div>
            <Switch 
                checked={isNotifEnabled} 
                onCheckedChange={handleToggleNotification} 
            />
        </div>
        {permissionStatus === 'denied' && (
             <p className="text-[10px] text-red-500 mt-2 pl-[52px]">
                * System permission denied. Enable in device settings.
             </p>
        )}
      </Card>

      <div className="space-y-4">
        {notifications.length === 0 ? (
            <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground text-lg">No notifications yet.</p>
                <Button asChild variant="link" className="mt-2">
                    <Link href="/menus">Order Something!</Link>
                </Button>
            </div>
        ) : (
            notifications.map((notification) => (
                <Card 
                    key={notification._id} 
                    className={`overflow-hidden border transition-all hover:shadow-md animate-in slide-in-from-top-2 duration-300 ${!notification.isRead ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}
                >
                    <div className="p-4 flex gap-4">
                        <div className="shrink-0">
                            {notification.image ? (
                                <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted">
                                    <Image 
                                        src={optimizeImageUrl(notification.image)} 
                                        alt="Notification" 
                                        fill 
                                        sizes="48px"
                                        className="object-cover" 
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = PLACEHOLDER_IMAGE_URL;
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${!notification.isRead ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                                    <Bell className="h-5 w-5" />
                                </div>
                            )}
                        </div>

                        <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-start gap-2">
                                <h3 className={`text-sm font-semibold ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {notification.title}
                                </h3>
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1 shrink-0">
                                    <Clock className="h-3 w-3" /> {formatTimeAgo(notification.createdAt)}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                                {notification.message}
                            </p>
                            
                            {notification.link && (
                                <div className="mt-2">
                                    <Link href={notification.link} className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                                        View Details <ExternalLink className="h-3 w-3" />
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            ))
        )}
      </div>
    </div>
  );
}