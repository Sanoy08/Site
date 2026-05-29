// src/app/(shop)/layout.tsx

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // min-h-[100dvh] মোবাইলের স্ক্রিন সাইজ পারফেক্টলি ডিটেক্ট করে
    // pb-[env(safe-area-inset-bottom)] নিচের নেভিগেশন বারের জায়গাটা ছেড়ে দেবে
    <div className="flex flex-col min-h-[100dvh] pb-[env(safe-area-inset-bottom)]">
      <Header />
      
      {/* mb-20 বা mb-24 অ্যাড করা হলো যাতে ফুটার বা শেষের কনটেন্ট আপনার Mobile Nav-এর নিচে লুকিয়ে না যায় */}
      <main className="flex-grow mb-24">{children}</main>
      
      <Footer />
    </div>
  );
}