import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      
      {/* ★ FIX 4: Sticky Header Container with Safe Area Padding
          - sticky top-0: Ensures header stays at top when scrolling
          - pt-[env(safe-area-inset-top)]: Pushes the actual header content down by the height of the status bar
          - bg-background: Fills the background behind the status bar
          - z-50: Keeps it above all content
      */}
      <div className="sticky top-0 z-50 w-full bg-background pt-[env(safe-area-inset-top)] shadow-sm">
        <Header />
      </div>

      {/* Main Content Area */}
      <main className="flex-grow w-full max-w-[100vw] overflow-x-hidden">
        {children}
      </main>

      <Footer />

      {/* Bottom Safe Area Spacer (For iPhone Home Bar) */}
      <div className="pb-[env(safe-area-inset-bottom)] bg-background" />
    </div>
  );
}