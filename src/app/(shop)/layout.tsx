// src/app/(shop)/layout.tsx

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // bg-white দিয়ে পুরো ব্যাকগ্রাউন্ড সলিড সাদা করা হলো 
    // এবং pb-[env(safe-area-inset-bottom)] দিয়ে বটম সেফ এরিয়া সাদা রাখা হলো
    <div className="flex flex-col min-h-[100dvh] bg-white pb-[env(safe-area-inset-bottom)]">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}