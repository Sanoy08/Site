// src/components/AppUrlListener.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { App, URLOpenListenerEvent } from '@capacitor/app';

const AppUrlListener = () => {
  const router = useRouter();

  useEffect(() => {
    // অ্যাপ ওপেন হওয়ার লিসেনার
    const listener = App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      try {
        // ১. পুরো URL থেকে পাথ বের করা (যেমন: https://bumbaskitchen.app/menus -> /menus)
        const urlObj = new URL(event.url);
        
        // শুধু পাথ এবং কোয়েরি প্যারামস নেওয়া (যাতে ?id=... থাকলেও কাজ করে)
        const path = urlObj.pathname + urlObj.search;

        // ২. যদি ডোমেইন মিলে যায়, তবে নেভিগেট করো
        if (event.url.includes('bumbaskitchen.app')) {
            // Next.js রাউটার দিয়ে পেজ চেঞ্জ করা
            router.push(path);
        }
      } catch (error) {
        console.error('Deep Link Error:', error);
      }
    });

    // ক্লিনআপ
    return () => {
        listener.then(handler => handler.remove());
    };
  }, [router]);

  return null; // এটি কোনো UI রেন্ডার করবে না, শুধু ব্যাকগ্রাউন্ডে কাজ করবে
};

export default AppUrlListener;