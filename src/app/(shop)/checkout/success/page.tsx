'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { formatPrice } from '@/lib/utils';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Loader2 } from 'lucide-react';

// ★ Capacitor Plugin Register
const NativeSuccess = registerPlugin<any>('NativeSuccess');

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber') || '...';
  const name = searchParams.get('name') || 'Guest';
  const amount = searchParams.get('amount') || '0';

  const [earnRate, setEarnRate] = useState(2); 
  const [isWalletLoading, setIsWalletLoading] = useState(true); 

  // ★ ১. ব্যাকগ্রাউন্ডে ইউজারের ওয়ালেট ডাটা চেক করা
  useEffect(() => {
      const getWalletData = async () => {
          try {
              const res = await fetch('/api/wallet');
              const data = await res.json();
              if (data.success && data.wallet) {
                  const totalSpent = data.wallet.totalSpent || 0;
                  if (totalSpent >= 15000) {
                      setEarnRate(6);
                  } else if (totalSpent >= 5000) {
                      setEarnRate(4);
                  } else {
                      setEarnRate(2);
                  }
              }
          } catch (e) {
              console.error("Failed to fetch wallet info");
          } finally {
              setIsWalletLoading(false); 
          }
      };
      
      getWalletData();
  }, []);

  // ★ ২. ক্যালকুলেশন শেষ হলেই সাথে সাথে Native App-কে সিগন্যাল দেওয়া
  useEffect(() => {
      if (!isWalletLoading) {
          const parsedAmount = parseFloat(amount) || 0;
          const earnedCoins = Math.floor((parsedAmount * earnRate) / 100);

          if (Capacitor.isNativePlatform()) {
              // অ্যাপ হলে ডাইরেক্ট Java Plugin কল হবে
              NativeSuccess.show({
                  orderId: orderNumber,
                  name: name.split(' ')[0],
                  amount: formatPrice(parsedAmount),
                  coins: earnedCoins > 0 ? earnedCoins : 1
              });
          } else {
              // যদি ভুল করে কেউ ওয়েব থেকে ঢোকে, তাকে সরাসরি অর্ডারে পাঠিয়ে দেবে
              window.location.href = '/account/orders';
          }
      }
  }, [isWalletLoading, amount, earnRate, name, orderNumber]);

  // ★ ৩. মেইন ম্যাজিক: ব্যাকগ্রাউন্ডে কোনো ডিজাইন নেই, শুধু একটা সাদা স্ক্রিন
  return (
    <div className="fixed inset-0 z-[100] h-[100dvh] w-screen bg-white touch-none overscroll-none" />
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-[100] h-[100dvh] w-screen overflow-hidden bg-white flex flex-col items-center justify-center touch-none overscroll-none">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground font-medium text-sm animate-pulse">Confirming your order...</p>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}