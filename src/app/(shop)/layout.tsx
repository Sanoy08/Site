// src/app/(shop)/layout.tsx

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      
      {/* ★ ১. ফিক্সড স্ট্যাটাস বার ব্যাকগ্রাউন্ড (এটি নড়বে না) */}
      <div 
        className="fixed top-0 left-0 right-0 z-[100] bg-white"
        style={{ height: 'env(safe-area-inset-top)' }} 
      />

      {/* ★ ২. কন্টেন্ট র‍্যাপার (প্যাডিং দিয়ে নিচে নামানো হয়েছে) */}
      {/* pt-[env(...)] দেওয়া হয়েছে যাতে হেডারটি স্ট্যাটাস বারের নিচে চাপা না পড়ে */}
      <div className="flex-1 flex flex-col pt-[env(safe-area-inset-top)]">
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </div>

      {/* নিচের সেফ এরিয়া (আইফোনের হোম বারের জন্য) */}
      <div className="pb-[env(safe-area-inset-bottom)]" />
    </div>
  );
}