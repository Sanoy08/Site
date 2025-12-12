'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TicketPercent, Copy, CalendarOff, Sparkles, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatPrice } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type Coupon = {
  _id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  minOrder: number;
  expiryDate: string | null;
  isActive: boolean;
};

export default function AccountCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch('/api/coupons/list');
        const data = await res.json();
        if (data.success) {
          setCoupons(data.coupons);
        }
      } catch (error) {
        console.error("Failed to load coupons", error);
        toast.error("Could not load coupons.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Coupon code copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
         {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
         ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
        <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <TicketPercent className="h-5 w-5" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Available Coupons</h2>
                <p className="text-sm text-muted-foreground">Save more on your orders with these exclusive offers.</p>
            </div>
        </div>

      {coupons.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed flex flex-col items-center">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <TicketPercent className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700">No coupons available</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                Check back later! We regularly update our offers to give you the best deals.
            </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {coupons.map((coupon) => (
            <div 
                key={coupon._id} 
                className={cn(
                    "relative group overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md",
                    !coupon.isActive && "grayscale opacity-70 pointer-events-none bg-gray-50"
                )}
            >
                {/* Visual Side Accent */}
                <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1.5",
                    coupon.isActive ? "bg-gradient-to-b from-primary to-orange-600" : "bg-gray-300"
                )}></div>

                {/* Background Decoration */}
                <div className="absolute right-[-20px] top-[-20px] h-24 w-24 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors pointer-events-none"></div>

                <div className="p-5 pl-7 flex flex-col h-full justify-between gap-4">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <Badge variant={coupon.isActive ? "default" : "secondary"} className={cn("uppercase tracking-wider font-bold text-[10px]", coupon.isActive ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200" : "bg-gray-200 text-gray-500")}>
                                {coupon.isActive ? "Active" : "Expired"}
                            </Badge>
                            {coupon.isActive && (
                                <div className="text-xs font-medium text-orange-600 flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                                    <Sparkles className="h-3 w-3" /> Special
                                </div>
                            )}
                        </div>

                        <div className="flex items-baseline gap-1 mb-1">
                            <h3 className="text-2xl font-black text-gray-900">
                                {coupon.discountType === 'percentage' ? `${coupon.value}%` : formatPrice(coupon.value)}
                            </h3>
                            <span className="text-lg font-bold text-gray-900">OFF</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-snug">{coupon.description}</p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-gray-50 p-2 rounded-lg border border-dashed border-gray-200">
                            <CalendarOff className="h-3.5 w-3.5" />
                            {coupon.expiryDate ? (
                                <span>Expires on: <span className="font-medium text-gray-700">{new Date(coupon.expiryDate).toLocaleDateString()}</span></span>
                            ) : (
                                <span>No Expiry Date</span>
                            )}
                        </div>

                        {/* Code Section */}
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-50 border-2 border-dashed border-primary/20 rounded-lg h-11 flex items-center justify-center font-mono text-lg font-bold tracking-widest text-primary relative overflow-hidden group-hover:border-primary/40 transition-colors">
                                {coupon.code}
                            </div>
                            <Button 
                                size="icon" 
                                className="h-11 w-11 shrink-0 rounded-lg" 
                                variant={copiedId === coupon._id ? "default" : "outline"}
                                onClick={() => handleCopy(coupon.code, coupon._id)}
                                disabled={!coupon.isActive}
                            >
                                {copiedId === coupon._id ? <Check className="h-5 w-5" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}