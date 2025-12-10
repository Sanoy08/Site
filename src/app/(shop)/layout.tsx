import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      
      {/* Fixed Status Bar Background */}
      <div 
        className="fixed top-0 left-0 right-0 z-[100] bg-white"
        style={{ height: 'env(safe-area-inset-top)' }} 
      />

      {/* Content Wrapper */}
      <div className="flex-1 flex flex-col pt-[env(safe-area-inset-top)]">
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </div>

      {/* Bottom Safe Area */}
      <div className="pb-[env(safe-area-inset-bottom)]" />
    </div>
  );
}