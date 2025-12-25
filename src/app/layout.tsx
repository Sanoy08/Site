// src/app/layout.tsx

import type { Metadata, Viewport } from 'next';
import { Poppins, Amarante, Montserrat, Anek_Bangla, Pacifico } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartProvider';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { RealtimeMenuUpdater } from '@/components/providers/RealtimeMenuUpdater';
import { AppInitializer } from '@/components/AppInitializer';
import GlobalLoader from '@/components/GlobalLoader';
import { Suspense } from 'react';
import Image from 'next/image';
import NotificationPrompt from '@/components/NotificationPrompt';

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

const amarante = Amarante({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-headline',
  weight: '400',
});

const montserrat = Montserrat({ 
  subsets: ['latin'], 
  variable: '--font-montserrat',
  weight: ['900'] 
});

const anekBangla = Anek_Bangla({ 
  subsets: ['bengali'], 
  variable: '--font-anek-bangla',
  weight: ['500'] 
});

const pacifico = Pacifico({
  subsets: ['latin'],
  variable: '--font-pacifico',
  weight: '400',
});

export const metadata: Metadata = {
  title: "Bumba's Kitchen",
  description: 'Authentic Bengali cuisine delivered to your doorstep.',
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
          'font-sans antialiased', 
          poppins.variable, 
          amarante.variable,
          montserrat.variable,
          anekBangla.variable,
          pacifico.variable
      )}>
          
          {/* ★★★ VIDEO PRELOAD TRICK ★★★ */}
          {/* এই ভিডিওটি ইউজার দেখবে না, কিন্তু ব্রাউজার এটি আগে থেকেই লোড করে রাখবে */}
          <div className="hidden" aria-hidden="true">
            <video 
              src="/images/loader.mp4" 
              preload="auto" 
              muted 
              width={0} 
              height={0} 
            />
          </div>

          <CartProvider>
            <RealtimeMenuUpdater />
            <AppInitializer />
            
            <Suspense fallback={null}>
              <GlobalLoader />
            </Suspense>

            {/* ২. নোটিফিকেশন প্রম্পট এখানে যুক্ত করা হয়েছে */}
            <NotificationPrompt />
            
            {children}
            <Toaster />
          </CartProvider>
      </body>
    </html>
  );
}