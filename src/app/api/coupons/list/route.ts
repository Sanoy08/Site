// src/app/api/coupons/list/route.ts

import { NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("BumbasKitchenDB");

    const allActiveCoupons = await db.collection("coupons")
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .toArray();

    const currentDate = new Date();

    const validCoupons = allActiveCoupons.filter((coupon) => {
        // A. পার্সোনাল কুপন বাদ (isOneTime অথবা userId থাকলে)
        if (coupon.isOneTime === true) return false;
        if (coupon.userId) return false;

        // B. Usage Limit চেক (Fix: Exhausted কুপন হাইড করা)
        if (coupon.usageLimit !== undefined && coupon.usageLimit !== null && coupon.usageLimit > 0) {
            const timesUsed = coupon.timesUsed || 0;
            if (timesUsed >= coupon.usageLimit) return false; // লিমিট শেষ হয়ে গেলে বাদ
        }

        // C. Expiry Date চেক
        if (coupon.expiryDate) {
          const expDate = new Date(coupon.expiryDate); 
          if (!isNaN(expDate.getTime()) && expDate < currentDate) {
            return false; 
          }
        }

        return true;
      });

    return NextResponse.json({ success: true, coupons: validCoupons });

  } catch (error: any) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
} 