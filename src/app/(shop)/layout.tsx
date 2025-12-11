// src/app/(shop)/layout.tsx

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50">
      
      {/* ★★★ MASTER SOLUTION ★★★ */}
      {/* এই div টি পুরো হেডার সেকশনকে উপরে আটকে রাখবে (Sticky) */}
      <div className="sticky top-0 z-50 w-full bg-white shadow-sm">
        
        {/* ১. স্ট্যাটাস বার স্পেসার: এটি ঠিক নচ (Notch) এর সমান জায়গা নেবে */}
        {/* এটির ব্যাকগ্রাউন্ড সাদা, তাই স্ট্যাটাস বার সাদা দেখাবে */}
        <div className="w-full bg-white h-[env(safe-area-inset-top)]" />

        {/* ২. আসল হেডার: এটি স্পেসারের ঠিক নিচে বসবে */}
        <Header />
      </div>

      {/* মেইন কন্টেন্ট */}
      <main className="flex-grow">
        {children}
      </main>

      <Footer />

      {/* নিচের সেফ এরিয়া (আইফোনের জন্য) */}
      <div className="h-[env(safe-area-inset-bottom)] bg-white" />
    </div>
  );
}