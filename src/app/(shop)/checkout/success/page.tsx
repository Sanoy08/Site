'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
    CheckCircle2, 
    ShoppingBag, 
    Bell, 
    MessageCircle,
    Receipt,
    Sparkles,
    Loader2,
    ChevronRight
} from 'lucide-react';
import { useEffect, Suspense } from 'react';
import { formatPrice } from '@/lib/utils';
import { motion } from 'framer-motion';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const orderNumber = searchParams.get('orderNumber') || '...';
  const name = searchParams.get('name') || 'Guest';
  const amount = searchParams.get('amount') || '0';

  useEffect(() => {
      // ★ আপনার লোকাল সাউন্ড এফেক্ট প্লে করা হচ্ছে
      const audio = new Audio("/Elements/success.mp3");
      audio.volume = 0.5;
      audio.play().catch((e) => {
          console.log("Audio autoplay blocked by browser", e);
      });
  }, []);

  // Framer Motion Variants for smooth, bouncy entry
  const containerVariants = {
      hidden: { opacity: 0 },
      show: {
          opacity: 1,
          transition: { staggerChildren: 0.1, delayChildren: 0.1 }
      }
  };

  const itemVariants = {
      hidden: { opacity: 0, y: 15, scale: 0.95 },
      show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 350, damping: 25 } }
  };

  return (
    // ★ fixed inset-0 z-[100] h-[100dvh] overflow-hidden দেওয়া হয়েছে যাতে একদম স্ক্রল না হয় এবং Header/Footer ঢেকে যায়
    <div className="fixed inset-0 z-[100] h-[100dvh] w-screen overflow-hidden bg-gradient-to-br from-green-50/80 via-white to-blue-50/50 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show"
        className="w-full max-w-[400px] relative z-10 flex flex-col bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-green-500/10 border border-white/60 p-6 sm:p-8"
      >
          {/* Top Background Glow inside the card */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-green-100/50 to-transparent rounded-t-[2rem] -z-10 pointer-events-none"></div>
          
          {/* 1. Animated Success Icon */}
          <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 250, damping: 15, delay: 0.1 }}
              className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center shrink-0"
          >
              <motion.div 
                  animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-green-100 rounded-full"
              ></motion.div>
              <motion.div 
                  animate={{ scale: [1, 1.45, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                  className="absolute inset-0 bg-green-50 rounded-full"
              ></motion.div>
              
              <div className="relative z-10 bg-white rounded-full p-0.5 shadow-sm">
                  <CheckCircle2 className="h-[68px] w-[68px] text-green-500 drop-shadow-sm" />
              </div>
              
              {/* Floating Sparkles */}
              <motion.div animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -top-1 -right-2"><Sparkles className="h-5 w-5 text-yellow-400" /></motion.div>
              <motion.div animate={{ y: [0, 8, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2.5, repeat: Infinity }} className="absolute bottom-1 -left-2"><Sparkles className="h-4 w-4 text-yellow-400" /></motion.div>
          </motion.div>

          {/* 2. Text Content */}
          <motion.div variants={itemVariants} className="text-center mb-5 shrink-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 mb-1">
                  Order Placed!
              </h1>
              <p className="text-sm text-gray-500 font-medium">
                  Yay, <span className="text-gray-900 font-bold">{name.split(' ')[0]}</span>! Your food is being prepared.
              </p>
          </motion.div>

          {/* 3. Order Details Receipt (Compact) */}
          <motion.div variants={itemVariants} className="mb-5 shrink-0">
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100/80 border-dashed relative">
                  {/* Receipt Cutouts */}
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-r border-gray-100 border-dashed"></div>
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-l border-gray-100 border-dashed"></div>

                  <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                          <Receipt className="h-3 w-3" /> Order ID
                      </span>
                      <span className="font-mono font-bold text-gray-900 bg-white px-2 py-0.5 rounded text-xs shadow-sm border border-gray-100">
                          #{orderNumber}
                      </span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Amount</span>
                      <span className="font-bold text-primary text-base">{formatPrice(parseFloat(amount))}</span>
                  </div>
              </div>
          </motion.div>

          {/* 4. Notification Alert Box (Compact) */}
          <motion.div variants={itemVariants} className="mb-6 shrink-0">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/50 rounded-xl p-3 flex items-center gap-3 shadow-inner">
                  <div className="bg-white p-2 rounded-full shadow-sm text-blue-500 shrink-0">
                      <Bell className="h-4 w-4 animate-pulse" />
                  </div>
                  <div>
                      <p className="text-xs text-blue-900 leading-snug font-medium">
                          Track updates via <span className="font-bold inline-flex items-center gap-0.5"><MessageCircle className="h-3 w-3 text-green-500"/> WhatsApp</span> & App Notifications.
                      </p>
                  </div>
              </div>
          </motion.div>

          {/* 5. Action Buttons (Space Saving Layout) */}
          <motion.div variants={itemVariants} className="flex flex-col gap-2 mt-auto shrink-0">
              <Button 
                  onClick={() => router.push('/account/orders')}
                  className="w-full h-12 text-[15px] font-bold rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] group"
              >
                  <ShoppingBag className="mr-2 h-4 w-4" /> View Order
                  <ChevronRight className="ml-auto h-4 w-4 opacity-50 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button 
                  variant="ghost"
                  onClick={() => router.push('/menus')}
                  className="w-full h-10 text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                  Continue Browsing
              </Button>
          </motion.div>

      </motion.div>
    </div>
  );
}

// Suspense Wrapper
export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-[100] h-[100dvh] w-screen overflow-hidden bg-white flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground font-medium text-sm animate-pulse">Loading order details...</p>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}