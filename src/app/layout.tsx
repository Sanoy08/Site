// src/app/layout.tsx

import type { Metadata, Viewport } from 'next';
import { Poppins, Amarante, Montserrat, Anek_Bangla, Pacifico } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartProvider';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { RealtimeMenuUpdater } from '@/components/providers/RealtimeMenuUpdater';
import { AppInitializer } from '@/components/AppInitializer';
import { StatusBarBackground } from '@/components/ui/StatusBarBackground'; // নতুন কম্পোনেন্ট ইমপোর্ট

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

// ★★★ ভিউপোর্ট কনফিগারেশন ★★★
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // পুরো স্ক্রিন জুড়ে অ্যাপ থাকবে
  themeColor: '#ffffff', // ব্রাউজার বা সিস্টেম বারের কালার
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
            
            {/* অ্যাপ এবং স্ট্যাটাস বার কনফিগারেশন */}
            <AppInitializer />
            
            {/* ★ ফিক্সড সাদা বার (iOS এর জন্য) */}
            <StatusBarBackground />
            
            {children}
            <Toaster />
          </CartProvider>
      </body>
    </html>
  );
}