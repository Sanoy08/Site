// src/app/(shop)/layout.tsx

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
      
      {/* ★ MAGIC FIX: নিচের ট্রান্সপারেন্ট নেভিগেশন বারের ঠিক পেছনে একটা সাদা ব্যাকগ্রাউন্ড বসিয়ে দেওয়া হলো ★ */}
      <div 
        className="fixed bottom-0 left-0 w-full bg-white z-[9999] pointer-events-none" 
        style={{ height: 'env(safe-area-inset-bottom)' }} 
      />
    </div>
  );
}