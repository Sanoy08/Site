// src/components/account/CouponCard.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Ticket, Percent } from 'lucide-react';
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

  return (
    <div className="relative flex flex-col sm:flex-row bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
      {/* Left Side (Decor) */}
      <div className="bg-primary/5 p-6 flex flex-col items-center justify-center sm:w-32 border-b sm:border-b-0 sm:border-r border-dashed border-primary/20 relative">
        <div className="p-3 bg-white rounded-full shadow-sm mb-2">
            {isFlat ? <Ticket className="h-6 w-6 text-primary" /> : <Percent className="h-6 w-6 text-primary" />}
        </div>
        <span className="font-bold text-lg text-primary">
            {isFlat ? `₹${coupon.value}` : `${coupon.value}%`}
        </span>
        <span className="text-xs uppercase font-medium text-primary/60">OFF</span>
        
        {/* Cutout Circles */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-50 rounded-full sm:hidden" />
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-50 rounded-full sm:hidden" />
        <div className="absolute left-1/2 -top-2 -translate-x-1/2 w-4 h-4 bg-gray-50 rounded-full hidden sm:block" />
        <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-4 h-4 bg-gray-50 rounded-full hidden sm:block" />
      </div>

      {/* Right Side (Content) */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
            <div className="flex justify-between items-start mb-2">
                <Badge variant="outline" className="font-mono text-sm tracking-wide bg-gray-50 border-gray-200 text-gray-700">
                    {coupon.code}
                </Badge>
                {coupon.expiryDate && (
                    <span className="text-[10px] text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">
                        Exp: {new Date(coupon.expiryDate).toLocaleDateString()}
                    </span>
                )}
            </div>
            <p className="text-sm text-gray-600 mb-1 font-medium">
                {coupon.description || `Save flat ₹${coupon.value} on your order`}
            </p>
            <p className="text-xs text-muted-foreground">
                Min Order: <span className="font-semibold text-gray-900">₹{coupon.minOrder || 0}</span>
            </p>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
            <Button 
                size="sm" 
                variant="ghost" 
                className={cn("text-primary hover:text-primary hover:bg-primary/5 gap-2", copied && "text-green-600 hover:text-green-600 hover:bg-green-50")}
                onClick={handleCopy}
            >
                {copied ? (
                    <><Check className="h-4 w-4" /> Copied</>
                ) : (
                    <><Copy className="h-4 w-4" /> Copy Code</>
                )}
            </Button>
        </div>
      </div>
    </div>
  );
}