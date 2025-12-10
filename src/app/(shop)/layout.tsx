// src/app/(shop)/layout.tsx

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-white">
      
      {/* ★★★ MASTER FIX ★★★
         আমরা হেডারকে একটি 'sticky' div এর মধ্যে রাখছি।
         'pt-[env(safe-area-inset-top)]' ক্লাসটি ফোনের নচ অনুযায়ী অটোমেটিক প্যাডিং দেবে।
         'bg-white' থাকার কারণে স্ট্যাটাস বারের পেছনের অংশ সাদা দেখাবে।
         'z-50' এবং 'top-0' হেডারকে সবসময় উপরে রাখবে।
      */}
      <div className="sticky top-0 z-50 w-full bg-white pt-[env(safe-area-inset-top)] shadow-sm">
        <Header />
      </div>

      {/* মেইন কন্টেন্ট */}
      <main className="flex-grow">
        {children}
      </main>

      <Footer />

      {/* নিচের সেফ এরিয়া (আইফোনের জন্য দরকারি) */}
      <div className="pb-[env(safe-area-inset-bottom)] bg-white" />
    </div>
  );
}