'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CouponCardProps {
  coupon: any;
}

export function CouponCard({ coupon }: CouponCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    toast.success("Coupon code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const isFlat = coupon.discountType === 'flat';
  const expiryDate = coupon.expiryDate ? new Date(coupon.expiryDate) : null;
  const isLifetime = !expiryDate;
  
  // ইউনিক আইডি জেনারেট করা যাতে এক পেজে মাল্টিপল কুপন থাকলে SVG ক্লিপিং না ভাঙে
  const clipId = `ticket-cut-${coupon._id || coupon.code}`;

  return (
    <div className="relative w-full drop-shadow-md hover:drop-shadow-xl transition-all duration-300 group">
      
      {/* SVG MASK DEFINITION (Hidden) */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path
              d="M0,0.08 
                 Q0.03,0.08 0.03,0 
                 H0.97 
                 Q0.97,0.08 1,0.08 
                 V0.45 
                 Q0.96,0.5 1,0.55 
                 V0.92 
                 Q0.97,0.92 0.97,1 
                 H0.03 
                 Q0.03,0.92 0,0.92 
                 V0.55 
                 Q0.04,0.5 0,0.45 
                 Z"
            />
          </clipPath>
        </defs>
      </svg>

      {/* ACTUAL TICKET CARD */}
      <div
        className="relative flex bg-white h-40 sm:h-44 w-full"
        style={{ clipPath: `url(#${clipId})` }}
      >
        
        {/* --- LEFT STRIP (Theme Color) --- */}
        <div className="w-12 sm:w-16 bg-primary flex items-center justify-center shrink-0">
           {/* Vertical Text */}
           <span className="-rotate-90 text-white text-[10px] sm:text-xs tracking-[0.35em] font-bold uppercase whitespace-nowrap opacity-90">
             Official Coupon
           </span>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="flex-1 px-5 py-4 flex justify-between items-center bg-white relative">
            
            {/* Left Content: Value & Info */}
            <div className="flex flex-col justify-center h-full space-y-1">
                <div className="flex items-center gap-2 mb-1">
                     <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-100 uppercase tracking-wide">
                        Promo
                     </span>
                </div>

                <div className="flex items-baseline">
                    <span className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tighter">
                        {isFlat ? '₹' : ''}{coupon.value}{!isFlat && '%'}
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-gray-900 ml-1">OFF</span>
                </div>

                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                   Min order ₹{coupon.minOrder}
                </p>
                
                <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-2">
                    <Clock className="h-3 w-3" />
                    {isLifetime ? "Lifetime Validity" : `Exp: ${expiryDate?.toLocaleDateString('en-GB')}`}
                </div>
            </div>

            {/* Right Content: Code & Button */}
            <div className="flex flex-col items-end justify-center gap-3 pl-2 sm:pl-4 border-l border-dashed border-gray-200 h-[80%] my-auto">
                <div className="text-right">
                    <p className="text-[10px] uppercase text-gray-400 font-bold mb-1 tracking-wider">Use Code</p>
                    <div className="border-2 border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 rounded-lg font-mono text-sm sm:text-base font-bold text-primary select-all">
                        {coupon.code}
                    </div>
                </div>

                <Button
                    size="sm"
                    onClick={handleCopy}
                    className={cn(
                        "rounded-full px-5 text-xs font-bold transition-all shadow-none h-8",
                        copied
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-gray-900 hover:bg-primary text-white"
                    )}
                >
                    {copied ? (
                        <span className="flex items-center gap-1"><Check className="h-3 w-3"/> COPIED</span>
                    ) : (
                        <span className="flex items-center gap-1"><Copy className="h-3 w-3"/> COPY</span>
                    )}
                </Button>
            </div>
        </div>

        {/* Subtle Inner Shadow for Realism */}
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.02)]" />
      </div>
    </div>
  );
}