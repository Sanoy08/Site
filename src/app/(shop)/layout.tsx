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
      {/* ব্যাখ্যা:
         1. min-h-[100dvh]: এটি মোবাইল ব্রাউজারের অ্যাড্রেস বার ওঠা-নামা করলেও লেআউট ফিক্স রাখে।
         2. pt-[env(...)] / pb-[env(...)]: এটি ফোনের নচ (Notch) এবং নিচের বারের জন্য অটোমেটিক প্যাডিং দেয়।
      */}
      
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}