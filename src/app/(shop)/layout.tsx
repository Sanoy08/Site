import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // min-h-[100dvh] মোবাইল ব্রাউজারের হাইট জাম্প ফিক্স করে
    <div className="flex flex-col min-h-[100dvh] bg-white">
      
      {/* ★★★ ফিক্স ৫: স্টিকি হেডার কন্টেইনার ★★★ */}
      <div className="sticky top-0 z-[100] w-full bg-white shadow-sm">
        
        {/* ১. স্ট্যাটাস বার স্পেসার (CSS ক্লাস দিয়ে) */}
        {/* এটি নচ বা স্ট্যাটাস বারের ঠিক পেছনে বসে থাকবে */}
        <div className="w-full bg-white h-safe-top" />

        {/* ২. হেডার */}
        <Header />
      </div>

      {/* মেইন কন্টেন্ট */}
      <main className="flex-grow w-full max-w-[100vw] overflow-x-hidden">
        {children}
      </main>

      <Footer />

      {/* নিচের সেফ এরিয়া স্পেসার */}
      <div className="pb-safe bg-white" />
    </div>
  );
}