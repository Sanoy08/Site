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

      <div 
        className="fixed top-0 left-0 right-0 z-[9999] bg-white"
        style={{ height: 'env(safe-area-inset-top)' }} 
      />


      <div className="flex-1 flex flex-col pt-[env(safe-area-inset-top)]">
        <Header />
        <main className="flex-grow relative z-0">
          {children}
        </main>
        <Footer />
      </div>

      <div className="pb-[env(safe-area-inset-bottom)] bg-white" />
    </div>
  );
}