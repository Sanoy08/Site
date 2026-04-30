// src/components/providers/RealtimeMenuUpdater.tsx

'use client';

import { useEffect } from 'react';
import Pusher from 'pusher-js';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function RealtimeMenuUpdater() {
  const router = useRouter();

  useEffect(() => {
    // কানেকশন সেটআপ
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe('menu-updates');

    channel.bind('product-changed', (data: any) => {
      console.log('Realtime update received:', data);
      
      toast.info(data.message || 'Menu updated, refreshing...', {
        duration: 3000,
        position: 'bottom-right',
        icon: '🔄'
      });

      // 🌟 ১. মেনু পেজকে ডাটা রিফ্রেশ করার জন্য সিগন্যাল পাঠানো
      window.dispatchEvent(new Event('menu-updated'));

      // ২. সার্ভার ক্যাশ রিফ্রেশ
      router.refresh();
    });

    return () => {
      pusher.unsubscribe('menu-updates');
    };
  }, [router]);

  return null;
}