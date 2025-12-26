// src/hooks/use-back-button.ts

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useRouter, usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

// একটি গ্লোবাল ভেরিয়েবল যা ট্র্যাক করবে বর্তমানে কে ব্যাক বাটন কন্ট্রোল করছে
let customBackHandler: (() => void) | null = null;

// এই ফাংশনটি দিয়ে অন্য কম্পোনেন্টরা ব্যাক বাটন হ্যান্ডলার রেজিস্টার করবে
export const registerBackHandler = (handler: (() => void) | null) => {
  customBackHandler = handler;
};

export const useBackButton = () => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleBackButton = async () => {
      // ১. যদি কোনো কাস্টম হ্যান্ডলার (যেমন কার্ট বা সার্চ শিট) সেট করা থাকে
      if (customBackHandler) {
        customBackHandler(); // শিট বন্ধ করার ফাংশনটি কল হবে
        return; // এখানেই থামুন, এক্সিট বা ব্যাক করবেন না
      }

      // ২. ডিফল্ট লজিক (যদি কোনো শিট খোলা না থাকে)
      if (pathname === '/' || pathname === '/login') {
        App.exitApp();
      } else {
        router.back();
      }
    };

    // লিসেনার অ্যাড করা
    const listener = App.addListener('backButton', handleBackButton);

    // ক্লিনআপ
    return () => {
      listener.then(l => l.remove());
    };
  }, [pathname, router]);
};