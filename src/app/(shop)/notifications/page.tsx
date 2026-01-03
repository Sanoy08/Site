// src/app/(shop)/notifications/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch'; // ✅ Switch component
import { Bell, Loader2, Clock, ExternalLink, ShieldCheck, BellOff } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import { PLACEHOLDER_IMAGE_URL } from '@/lib/constants';
import { optimizeImageUrl } from '@/lib/imageUtils';

// ✅ Push Notification Hook Import
import { usePushNotification } from '@/hooks/use-push-notification';

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
  const router = useRouter();

  // ✅ Push Notification Logic
  const { isSupported, isSubscribed, subscribe, unsubscribe, isLoading: isPushLoading } = usePushNotification();

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch('/api/notifications/history', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
            setNotifications(data.notifications);
        }
    } catch (error) {
        console.error("Error fetching notifications:", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !user) {
        router.push('/login');
        return;
    }
    if (user) {
        fetchNotifications();
    }

    const handleUpdate = () => {
        fetchNotifications();
    };

    window.addEventListener('notification-updated', handleUpdate);
    return () => {
        window.removeEventListener('notification-updated', handleUpdate);
    };
  }, [user, isAuthLoading, router, fetchNotifications]);

  const handleTogglePush = async (checked: boolean) => {
    if (checked) {
      const success = await subscribe();
      if (success) toast.success("Notifications enabled successfully! 🔔");
    } else {
      const success = await unsubscribe();
      if (success) toast.success("Notifications disabled.");
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
  };

  if (isAuthLoading || isLoading) {
      return <div className="flex justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container max-w-2xl py-8 min-h-screen">
      
      {/* --- 🔔 PUSH SETTINGS CARD --- */}
      <Card className="mb-8 overflow-hidden border-primary/20 shadow-sm">
        <div className="p-5 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isSubscribed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
              {isSubscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Push Notifications</h2>
              <p className="text-xs text-muted-foreground">
                {isSubscribed ? 'You are receiving real-time alerts' : 'Enable to get order updates'}
              </p>
            </div>
          </div>
          
          {isSupported ? (
            <div className="flex items-center gap-2">
              {isPushLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              <Switch 
                checked={isSubscribed} 
                onCheckedChange={handleTogglePush}
                disabled={isPushLoading}
              />
            </div>
          ) : (
            <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-200 bg-orange-50">Not Supported</Badge>
          )}
        </div>
      </Card>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold font-headline flex items-center gap-2">
            History
        </h1>
        {notifications.length > 0 && (
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {notifications.length} Total
          </span>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
            <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground text-lg">You have no notifications yet.</p>
                <Button asChild variant="link" className="mt-2">
                    <Link href="/menus">Browse Menu</Link>
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
                                            target.src = PLACEHOLDER_IMAGE_URL || '/placeholder.png';
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${!notification.isRead ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                                    <Bell className="h-6 w-6" />
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
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                {notification.message}
                            </p>
                            
                            {notification.link && (
                                <div className="mt-3">
                                    <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1 rounded-lg">
                                        <Link href={notification.link}>
                                            Visit Link <ExternalLink className="h-3 w-3" />
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                        
                        {!notification.isRead && (
                            <div className="shrink-0 pt-1">
                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            </div>
                        )}
                    </div>
                </Card>
            ))
        )}
      </div>
    </div>
  );
}