import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // আমরা কমেন্ট থেকে 'env(...)' লেখাটি সরিয়ে দিয়েছি যাতে Tailwind কনফিউজ না হয়
    <div className="flex flex-col min-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}