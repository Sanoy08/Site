// src/app/(shop)/layout.tsx

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // min-h-screen এর বদলে min-h-[100dvh] ব্যবহার করা হলো
    <div className="flex flex-col min-h-[100dvh] bg-white">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}