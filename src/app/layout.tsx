// src/app/layout.tsx

import AnimatedSplash from '@/components/AnimatedSplash';
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
        <link rel="preconnect" href="https://banglawebfonts.pages.dev" />
        
        {/* ★ Lottie Animation Preloader - ফাস্ট লোডিংয়ের জন্য ★ */}
        <link rel="preload" href="/Food Courier.lottie" as="fetch" crossOrigin="anonymous" />

        {/* All Bangla Web Fonts from the list */}
        <link href="https://banglawebfonts.pages.dev/css/solaiman-lipi.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/kalpurush.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/siyam-rupali.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/hind-siliguri.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/baloo-da-2.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/lohit-bengali.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/tiro-bangla.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/noto-serif-bengali.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/mina.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/bornomala.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/bornomala-vintage.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/ekushey-lal-sabuj.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/adorsho-lipi.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/charukola.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/ab-shapla.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/ekushey-mukto.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/bensen.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/bensen-handwriting.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/ekushey-saraswatii.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/atma.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/charu-chandan.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/ekushey-azad.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/noto-sans-bengali.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/google-sans.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/anek-bangla.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/hoogli.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/bornoporichay.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/aikya.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/kalaa.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/mukti.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/un-bangla.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/tuli.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/alkatra.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/galada.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/sapa.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/somoyer-srot.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/abu-sayed.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/nilima.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/ekush.css" rel="stylesheet" />
        <link href="https://banglawebfonts.pages.dev/css/ekushey-aloucik.css" rel="stylesheet" />
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
          <AnimatedSplash />
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
            <Toaster />
          </CartProvider>
          <MobileNav />
      </body>
    </html>
  );
}