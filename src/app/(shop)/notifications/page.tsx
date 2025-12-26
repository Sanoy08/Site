// src/app/(shop)/notifications/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Loader2, Clock, ExternalLink, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import { cn } from '@/lib/utils'; // স্টাইল মার্জ করার জন্য

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" /> Notifications
        </h1>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            Total: {notifications.length}
        </span>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
            <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground text-lg">You have no notifications yet.</p>
                <Button asChild variant="link" className="mt-2">
                    <Link href="/menus">Browse Menu</Link>
                </Button>
            </div>
        ) : (
            notifications.map((notification) => {
                // আনরিড চেক লজিক
                const isUnread = !notification.isRead;

                return (
                <Card 
                    key={notification._id} 
                    className={cn(
                        "overflow-hidden transition-all duration-300 relative group",
                        // ★★★ High Contrast Styling Here ★★★
                        isUnread 
                            ? "bg-primary/10 border-primary shadow-md scale-[1.01]" // নতুন হলে সবুজ আভা এবং বর্ডার
                            : "bg-card border-border/50 opacity-80 hover:opacity-100" // পুরানো হলে সাদা এবং হালকা ঝাপসা
                    )}
                >
                    <div className="p-4 flex gap-4">
                        {/* আইকন বা ছবি */}
                        <div className="shrink-0 pt-1">
                            {notification.image ? (
                                <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted border border-border">
                                    <Image src={notification.image} alt="Notification" fill className="object-cover" unoptimized={true} />
                                </div>
                            ) : (
                                <div className={cn(
                                    "h-12 w-12 rounded-full flex items-center justify-center shadow-sm",
                                    isUnread ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                )}>
                                    <Bell className="h-6 w-6" />
                                </div>
                            )}
                        </div>

                        {/* কন্টেন্ট */}
                        <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-start gap-2">
                                <h3 className={cn(
                                    "text-sm font-semibold leading-tight",
                                    isUnread ? "text-foreground font-bold" : "text-muted-foreground"
                                )}>
                                    {notification.title}
                                </h3>
                                
                                {/* টাইমস্ট্যাম্প */}
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1 shrink-0 bg-background/50 px-1.5 py-0.5 rounded-full border">
                                    <Clock className="h-3 w-3" /> {formatTimeAgo(notification.createdAt)}
                                </span>
                            </div>
                            
                            <p className={cn(
                                "text-sm mt-1 leading-relaxed",
                                isUnread ? "text-foreground/90" : "text-muted-foreground"
                            )}>
                                {notification.message}
                            </p>
                            
                            {/* অ্যাকশন লিংক */}
                            {notification.link && (
                                <div className="mt-3">
                                    <Button asChild size="sm" variant={isUnread ? "default" : "outline"} className="h-7 text-xs gap-1">
                                        <Link href={notification.link}>
                                            Visit Link <ExternalLink className="h-3 w-3" />
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                        
                        {/* ★★★ NEW BADGE INDICATOR ★★★ */}
                        {isUnread && (
                            <div className="absolute top-0 right-0">
                                <span className="bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg shadow-sm">
                                    NEW
                                </span>
                            </div>
                        )}
                    </div>
                </Card>
            )})
        )}
      </div>
    </div>
  );
}