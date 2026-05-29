// src/app/(shop)/layout.tsx

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // bg-white এবং pb-[env(safe-area-inset-bottom)] যোগ করা হয়েছে
    <div className="flex flex-col min-h-screen bg-white pb-[env(safe-area-inset-bottom)]">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}