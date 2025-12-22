'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CookingPot, ChefHat, Utensils, Truck, Pizza, 
  Coffee, ShoppingBag, UtensilsCrossed, Soup, Loader 
} from 'lucide-react';

// =========================================================
// ★★★SETTINGS: এখান থেকে ডিজাইন পরিবর্তন করুন (1-10) ★★★
// =========================================================
const DESIGN_OPTION = 3; 

// 1: Master Chef (টুপি বাউন্স করছে)
// 2: Sizzling Pot (রান্নার হাঁড়ি কাঁপছে)
// 3: Fast Delivery (স্কুটার দ্রুত যাচ্ছে)
// 4: Cutlery Spin (চামচ-কাঁটা ঘুরছে)
// 5: Hot Soup (স্যুপের বাটি থেকে ধোঁয়া উঠছে)
// 6: Pizza Time (পিৎজা ঘুরছে)
// 7: Morning Coffee (কফি কাপ ফেড ইন-আউট)
// 8: Shopping Bag (ব্যাগ বাউন্স করছে)
// 9: Cross Utensils (ক্রস করা চামচ পালস করছে)
// 10: Simple Circle (মিনিমালিস্ট লোডার)
// =========================================================

export default function GlobalLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // পেজ লোড লজিক এবং স্ক্রল লক
  useEffect(() => {
    setIsLoading(false);
    document.body.classList.remove('overflow-hidden');
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (
        anchor && anchor.href && anchor.href.startsWith(window.location.origin) &&
        !anchor.target && !anchor.getAttribute('download') &&
        anchor.pathname !== window.location.pathname
      ) {
        setIsLoading(true);
        document.body.classList.add('overflow-hidden');
      }
    };
    document.addEventListener('click', handleAnchorClick);
    return () => {
      document.removeEventListener('click', handleAnchorClick);
      document.body.classList.remove('overflow-hidden');
    };
  }, []);

  if (!isLoading) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 backdrop-blur-md touch-none"
      >
        {/* Design Switcher */}
        {renderLoaderDesign(DESIGN_OPTION)}

        {/* Branding Text */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-center"
        >
          <h2 className="text-2xl font-bold font-headline text-primary tracking-wide">
            Bumba's Kitchen
          </h2>
          <p className="text-sm font-medium text-muted-foreground animate-pulse mt-1">
            Preparing deliciousness...
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ==========================================
// ১০টি আলাদা ডিজাইনের ফাংশন
// ==========================================
function renderLoaderDesign(option: number) {
  const iconClass = "h-20 w-20 text-primary";

  switch (option) {
    case 1: // Master Chef
      return (
        <div className="relative">
           <motion.div
             animate={{ y: [0, -15, 0], scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
             transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
           >
             <ChefHat className={iconClass} strokeWidth={1.5} />
           </motion.div>
           <motion.div 
             className="absolute -bottom-2 left-1/2 w-12 h-1 bg-black/10 rounded-full blur-sm"
             animate={{ scale: [1, 0.8, 1], opacity: [0.5, 0.2, 0.5] }}
             transition={{ duration: 1.5, repeat: Infinity }}
             style={{ x: '-50%' }}
           />
        </div>
      );

    case 2: // Sizzling Pot
      return (
        <div className="relative">
          <div className="flex justify-center gap-1 mb-2 absolute -top-4 left-0 right-0">
             {[0, 1, 2].map((i) => (
               <motion.div
                 key={i}
                 className="w-1.5 h-1.5 bg-primary/40 rounded-full"
                 animate={{ y: [0, -20], opacity: [0, 1, 0] }}
                 transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, ease: "easeOut" }}
               />
             ))}
          </div>
          <motion.div
            animate={{ rotate: [-2, 2, -2], x: [-1, 1, -1] }}
            transition={{ duration: 0.3, repeat: Infinity }}
          >
            <CookingPot className={iconClass} strokeWidth={1.5} />
          </motion.div>
        </div>
      );

    case 3: // Fast Delivery
      return (
        <div className="relative overflow-hidden p-4">
          <motion.div
            animate={{ x: [-50, 50] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          >
            <Truck className={iconClass} strokeWidth={1.5} />
          </motion.div>
          <div className="absolute bottom-2 left-0 right-0 h-0.5 bg-gray-200">
             <motion.div 
               className="h-full bg-primary" 
               animate={{ x: [-100, 100] }} 
               transition={{ duration: 1, repeat: Infinity }}
             />
          </div>
        </div>
      );

    case 4: // Cutlery Spin
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="relative">
             <Utensils className={iconClass} strokeWidth={1.5} />
             <motion.div 
               className="absolute inset-0 border-4 border-primary/20 rounded-full"
               animate={{ scale: [1, 1.2, 1] }}
               transition={{ duration: 2, repeat: Infinity }}
             />
          </div>
        </motion.div>
      );

    case 5: // Hot Soup
      return (
        <div className="relative">
           <motion.div
             animate={{ y: [0, -5, 0] }}
             transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
           >
             <Soup className={iconClass} strokeWidth={1.5} />
           </motion.div>
           {[0, 1, 2].map((i) => (
             <motion.div
               key={i}
               className="absolute top-0 left-1/2 w-1 h-6 bg-primary/30 rounded-full"
               style={{ x: (i - 1) * 10 }}
               animate={{ y: [-10, -30], opacity: [0, 0.8, 0] }}
               transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
             />
           ))}
        </div>
      );

    case 6: // Pizza Time
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
           <Pizza className={iconClass} strokeWidth={1.5} />
        </motion.div>
      );

    case 7: // Morning Coffee
      return (
        <div className="relative">
          <Coffee className={iconClass} strokeWidth={1.5} />
          <motion.div
            className="absolute -top-4 right-2 text-2xl font-bold text-primary"
            animate={{ opacity: [0, 1, 0], y: [0, -20] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ♨
          </motion.div>
        </div>
      );

    case 8: // Shopping Bag
      return (
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          <ShoppingBag className={iconClass} strokeWidth={1.5} />
        </motion.div>
      );

    case 9: // Cross Utensils
      return (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <UtensilsCrossed className={iconClass} strokeWidth={1.5} />
        </motion.div>
      );

    case 10: // Simple Spinner
    default:
      return (
        <div className="relative">
           <motion.div
             animate={{ rotate: 360 }}
             transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
           >
             <Loader className={iconClass} strokeWidth={2} />
           </motion.div>
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="h-3 w-3 bg-primary rounded-full animate-ping"></div>
           </div>
        </div>
      );
  }
}