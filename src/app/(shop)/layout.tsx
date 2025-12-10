// src/app/(shop)/layout.tsx
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">

      
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}