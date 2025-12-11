import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // ১. min-h-screen: পুরো হাইট নেবে
    // ২. bg-white: স্ট্যাটাস বারের পেছনের জায়গাটা সাদা দেখাবে
    <div className="flex flex-col min-h-screen bg-white">
      
      {/* ★★★ MASTER FIX ★★★ 
          pt-[env(safe-area-inset-top)] -> এটি নচ বা স্ট্যাটাস বারের সমান প্যাডিং দেবে।
          sticky top-0 -> হেডারটি উপরে আটকে থাকবে।
          z-50 -> হেডারটি কন্টেন্টের উপরে ভাসবে।
      */}
      <div className="sticky top-0 z-50 w-full bg-white pt-[env(safe-area-inset-top)] shadow-sm">
        <Header />
      </div>

      {/* মেইন কন্টেন্ট */}
      <main className="flex-grow w-full">
        {children}
      </main>

      <Footer />

      {/* আইফোনের নিচের বারের জন্য সেফ এরিয়া */}
      <div className="pb-[env(safe-area-inset-bottom)] bg-white" />
    </div>
  );
}