// src/app/(shop)/account/coupons/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CouponCard } from '@/components/account/CouponCard';
import { Loader2, TicketPercent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AccountCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  return (
    <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
            <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                    <TicketPercent className="h-5 w-5" />
                </div>
                My Coupons
            </CardTitle>
            <CardDescription>
                Available offers & discounts for you
            </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : coupons.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {coupons.map((coupon) => (
                        <CouponCard key={coupon._id} coupon={coupon} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                    <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <TicketPercent className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No coupons available</h3>
                    <p className="text-muted-foreground mt-1 mb-4 text-sm">You don't have any active coupons right now.</p>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/menus">Order Now</Link>
                    </Button>
                </div>
            )}
        </CardContent>
    </Card>
  );
}