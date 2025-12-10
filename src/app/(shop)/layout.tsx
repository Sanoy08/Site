// src/app/(shop)/layout.tsx

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // ★ ফিক্স: 'pt-[env(safe-area-inset-top)]' সরিয়ে দেওয়া হয়েছে কারণ আমরা নেটিভলি এটা হ্যান্ডেল করছি
    <div className="flex flex-col min-h-[100dvh] pb-[env(safe-area-inset-bottom)]">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}