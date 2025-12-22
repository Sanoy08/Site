// src/app/layout.tsx

import type { Metadata, Viewport } from 'next';
import { Poppins, Amarante, Montserrat, Anek_Bangla, Pacifico } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartProvider';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { RealtimeMenuUpdater } from '@/components/providers/RealtimeMenuUpdater';
import { AppInitializer } from '@/components/AppInitializer';
// ১. লোডার কম্পোনেন্ট ইম্পোর্ট করুন
import GlobalLoader from '@/components/GlobalLoader'; 

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

// জুম এবং লেআউট ফিক্স সেটিংস
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
          <CartProvider>
            <RealtimeMenuUpdater />
            <AppInitializer />
            
            {/* ২. গ্লোবাল লোডারটি এখানে বসানো হয়েছে */}
            <GlobalLoader />
            
            {children}
            <Toaster />
          </CartProvider>
      </body>
    </html>
  );
}