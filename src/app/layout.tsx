// src/app/layout.tsx

import type { Metadata, Viewport } from 'next'; // ★ Viewport ইম্পোর্ট করুন
import { Poppins, Amarante, Montserrat, Anek_Bangla, Pacifico } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartProvider';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { RealtimeMenuUpdater } from '@/components/providers/RealtimeMenuUpdater';
import { AppInitializer } from '@/components/AppInitializer';

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

// ★★★ ফিক্স: ভিউপোর্ট সেটিংস যোগ করা হয়েছে ★★★
// এটি অ্যাপ এবং মোবাইল ব্রাউজারে লেআউট শিফটিং বন্ধ করবে
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // 'cover' দিলে অ্যাপটি স্ট্যাটাস বারের নিচ পর্যন্ত পুরো স্ক্রিন পাবে
  viewportFit: 'cover', 
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
          <CartProvider>
            <RealtimeMenuUpdater />
            <AppInitializer />
            {children}
            <Toaster />
          </CartProvider>
      </body>
    </html>
  );
}