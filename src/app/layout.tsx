// src/app/layout.tsx

import type { Metadata, Viewport } from 'next';
import { StoreStatusProvider } from '@/components/providers/StoreStatusProvider';
import { Poppins, Amarante, Montserrat, Anek_Bangla, Pacifico, Atma, Galada } from 'next/font/google';
import './globals.css';
import DeviceEnforcer from '@/components/DeviceEnforcer';
import { MobileNav } from "@/components/layout/MobileNav";
import { CartProvider } from '@/context/CartProvider';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { RealtimeMenuUpdater } from '@/components/providers/RealtimeMenuUpdater';
import { AppInitializer } from '@/components/AppInitializer';
import GlobalLoader from '@/components/GlobalLoader';
import { Suspense } from 'react';
import Image from 'next/image';
import NotificationPrompt from '@/components/NotificationPrompt';
import AppUrlListener from '@/components/AppUrlListener'; 
import { Chatbot } from "@/components/Chatbot";
import { AppUpdater } from '@/components/AppUpdater'; 
import StatusBarLogic from '@/components/StatusBarLogic'; 

const poppins = Poppins({ subsets: ['latin'], display: 'swap', variable: '--font-sans', weight: ['400', '500', '600', '700'] });
const amarante = Amarante({ subsets: ['latin'], display: 'swap', variable: '--font-headline', weight: '400' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat', weight: ['900'] });
const pacifico = Pacifico({ subsets: ['latin'], variable: '--font-pacifico', weight: '400' });

// Bengali Fonts Config
const anekBangla = Anek_Bangla({ subsets: ['bengali'], variable: '--font-anek-bangla', weight: ['400', '500', '600', '700'] });
const atma = Atma({ subsets: ['bengali'], variable: '--font-atma', weight: ['400', '600', '700'] });
const galada = Galada({ subsets: ['bengali'], variable: '--font-galada', weight: '400' });

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
      
      {/* ★ POSTER MAKER-এর জন্য Google Fonts (html2canvas এটা ছাড়া কাজ করবে না) ★ */}
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@100..800&family=Atma:wght@300;400;500;600;700&family=Galada&display=swap" rel="stylesheet" />
      </head>

      <body className={cn(
          'font-sans antialiased', 
          poppins.variable, 
          amarante.variable,
          montserrat.variable,
          anekBangla.variable,
          pacifico.variable,
          atma.variable,
          galada.variable
      )}>
          
          <div className="hidden" aria-hidden="true">
            <video src="/images/loader.mp4" preload="auto" muted width={0} height={0} />
          </div>

          <AppUrlListener />
          <StatusBarLogic /> 
          <CartProvider>
            <RealtimeMenuUpdater />
            <AppInitializer />
            <DeviceEnforcer />
            <Suspense fallback={null}>
              <GlobalLoader />
            </Suspense>

            <NotificationPrompt />
            
            <StoreStatusProvider>
                {children}
            </StoreStatusProvider>
            <AppUpdater />
            <Chatbot />
            <Toaster />
          </CartProvider>
          <MobileNav />
      </body>
    </html>
  );
}