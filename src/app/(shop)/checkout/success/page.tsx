'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
    ShoppingBag, 
    Bell, 
    MessageCircle,
    Receipt,
    Sparkles,
    Loader2,
    ChevronRight,
    Coins,
    Home
} from 'lucide-react';
import { useEffect, useState, Suspense } from 'react';
import { formatPrice } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const orderNumber = searchParams.get('orderNumber') || '...';
  const name = searchParams.get('name') || 'Guest';
  const amount = searchParams.get('amount') || '0';

  const [animationStage, setAnimationStage] = useState(0);
  const [earnRate, setEarnRate] = useState(2); // Default Bronze Rate

  // ★★★ SECURE WALLET FETCHING LOGIC ★★★
  // ইউজারের আসল টায়ার (Tier) জানার জন্য ডাটাবেস থেকে ডাটা ফেচ করা হচ্ছে
  useEffect(() => {
      const getWalletData = async () => {
          try {
              const res = await fetch('/api/wallet');
              const data = await res.json();
              if (data.success && data.wallet) {
                  const totalSpent = data.wallet.totalSpent || 0;
                  
                  // একদম ব্যাকএন্ডের (order-service.ts) মতো সেম লজিক
                  if (totalSpent >= 15000) {
                      setEarnRate(6); // Gold Tier
                  } else if (totalSpent >= 5000) {
                      setEarnRate(4); // Silver Tier
                  } else {
                      setEarnRate(2); // Bronze Tier
                  }
              }
          } catch (e) {
              console.error("Failed to fetch wallet info");
          }
      };
      
      getWalletData();
  }, []);

  // Strict Scroll Lock Logic
  useEffect(() => {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.style.touchAction = 'none';
      document.documentElement.style.overflow = 'hidden';

      // Sound Effect Play
      const audio = new Audio("/Elements/success.mp3");
      audio.volume = 0.5;
      audio.play().catch((e) => console.log("Audio autoplay blocked", e));

      // Trigger the layout expansion after 1.5 seconds
      const timer = setTimeout(() => {
          setAnimationStage(1);
      }, 1000);

      return () => {
          document.body.style.overflow = '';
          document.body.style.position = '';
          document.body.style.width = '';
          document.body.style.height = '';
          document.body.style.touchAction = '';
          document.documentElement.style.overflow = '';
          clearTimeout(timer);
      };
  }, []);

  // ★★★ EXACT COIN CALCULATION ★★★
  const parsedAmount = parseFloat(amount) || 0;
  const earnedCoins = Math.floor((parsedAmount * earnRate) / 100);

  return (
    <div className="fixed inset-0 z-[100] h-[100dvh] w-screen overflow-hidden touch-none overscroll-none bg-white flex flex-col items-center justify-center p-6 font-sans">
      
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      <motion.div 
        layout
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="w-full max-w-[380px] relative z-10 flex flex-col pointer-events-auto"
      >
          {/* Animated Success Tick */}
          <motion.div 
              layout
              className="relative w-24 h-24 mx-auto flex items-center justify-center shrink-0 z-20"
              style={{ marginTop: animationStage === 0 ? '20px' : '0px', marginBottom: animationStage === 0 ? '40px' : '20px' }}
          >
              <motion.div 
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-green-100 rounded-full"
              ></motion.div>
              
              <svg className="w-full h-full drop-shadow-sm z-10" viewBox="0 0 100 100">
                  <motion.circle cx="50" cy="50" r="45" fill="#22c55e" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }} />
                  <motion.path fill="none" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" d="M30 50 L45 65 L70 35" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }} />
              </svg>

              <AnimatePresence>
                  {animationStage === 1 && (
                      <>
                          <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute -top-1 -right-2"><Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" /></motion.div>
                          <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute bottom-1 -left-2"><Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" /></motion.div>
                      </>
                  )}
              </AnimatePresence>
          </motion.div>

          {/* Expanding Content */}
          <AnimatePresence mode="popLayout">
              {animationStage === 1 && (
                  <motion.div
                      initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
                      animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2, staggerChildren: 0.1 }}
                      className="flex flex-col gap-6 shrink-0"
                  >
                      {/* Text Header */}
                      <div className="text-center">
                          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-1.5">
                              Order Placed!
                          </h1>
                          <p className="text-[15px] text-gray-500 font-medium">
                              Awesome, <span className="text-gray-900 font-bold">{name.split(' ')[0]}</span>! Your food is getting ready.
                          </p>
                      </div>

                      {/* Receipt & Order ID */}
                      <div className="bg-gray-50/80 rounded-2xl p-4.5 border border-gray-200/60 border-dashed relative">
                          <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full border-r border-gray-200/60 border-dashed"></div>
                          <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full border-l border-gray-200/60 border-dashed"></div>

                          <div className="flex justify-between items-center mb-2.5 px-1">
                              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <Receipt className="h-3.5 w-3.5" /> Order ID
                              </span>
                              <span className="font-mono font-bold text-gray-900 bg-white px-2.5 py-1 rounded-md text-xs shadow-sm border border-gray-100">
                                  #{orderNumber}
                              </span>
                          </div>
                          <div className="flex justify-between items-center px-1">
                              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Amount Paid</span>
                              <span className="font-extrabold text-primary text-lg">{formatPrice(parsedAmount)}</span>
                          </div>
                      </div>

                      {/* Coins Earned Section (Only show if coins > 0) */}
                      {earnedCoins > 0 && (
                          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 p-3.5 shadow-sm">
                              <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-400/20 rounded-full blur-2xl"></div>
                              <div className="flex items-center justify-between relative z-10">
                                  <div className="flex items-center gap-3.5">
                                      <div className="bg-white p-2 rounded-full shadow-sm border border-amber-100 shrink-0">
                                          <Coins className="h-5 w-5 text-amber-500" />
                                      </div>
                                      <div>
                                          <p className="text-xs font-bold text-amber-950 uppercase tracking-wide">Coins on the way!</p>
                                          <p className="text-[11px] text-amber-700/80 font-medium leading-tight mt-0.5">Credited after delivery</p>
                                      </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                      <span className="text-xl font-extrabold text-amber-600 drop-shadow-sm">+{earnedCoins}</span>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* Tracker Alert */}
                      <div className="bg-blue-50/60 border border-blue-100/80 rounded-2xl p-3.5 flex items-center gap-3.5">
                          <div className="bg-white p-2 rounded-full shadow-sm text-blue-500 shrink-0">
                              <Bell className="h-4 w-4 animate-bounce" />
                          </div>
                          <p className="text-xs text-blue-900/90 leading-relaxed font-medium">
                              Track updates via <span className="font-bold inline-flex items-center gap-1 mx-0.5"><MessageCircle className="h-3.5 w-3.5 text-green-500"/> WhatsApp</span> & App Notifications.
                          </p>
                      </div>

                      {/* Buttons */}
                      <div className="flex flex-col gap-2.5 mt-2">
                          <Button 
                              onClick={() => router.push('/account/orders')}
                              className="w-full h-14 text-base font-bold rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                          >
                              <ShoppingBag className="mr-2 h-5 w-5" /> View Order
                              <ChevronRight className="ml-auto h-4 w-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                          </Button>
                          
                          <Button 
                              variant="ghost"
                              onClick={() => router.push('/menus')}
                              className="w-full h-12 text-[15px] font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                          >
                              <Home className="mr-2 h-4 w-4" /> Back to Home
                          </Button>
                      </div>
                  </motion.div>
              )}
          </AnimatePresence>

      </motion.div>
    </div>
  );
}

// Suspense Wrapper for SearchParams
export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-[100] h-[100dvh] w-screen overflow-hidden bg-white flex flex-col items-center justify-center touch-none overscroll-none">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground font-medium text-sm animate-pulse">Confirming your order...</p>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}