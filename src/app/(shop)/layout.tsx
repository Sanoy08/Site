// src/app/(shop)/layout.tsx

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // ★★★ ফিক্স: 'pt-[env(safe-area-inset-top)]' যোগ করা হয়েছে ★★★
    // এটি কন্টেন্টকে স্ট্যাটাস বারের নিচে নামিয়ে দেবে
    <div className="flex flex-col min-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-white">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}