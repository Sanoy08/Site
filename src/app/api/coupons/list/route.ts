// src/app/api/coupons/list/route.ts

import { NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("BumbasKitchenDB");

    // ১. সব অ্যাক্টিভ কুপন আনুন
    const allActiveCoupons = await db.collection("coupons")
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .toArray();

    const currentDate = new Date();

    // ২. ফিল্টারিং লজিক আপডেট
    const validCoupons = allActiveCoupons.filter((coupon) => {
        // A. পার্সোনাল কুপন বাদ (isOneTime অথবা userId থাকলে)
        if (coupon.isOneTime === true) return false;
        if (coupon.userId) return false;

        // B. Usage Limit চেক (FIXED)
        // আগে ছিল: if (coupon.usageLimit <= 1)
        // এখন: শুধুমাত্র যদি লিমিট '1' হয়, তবেই বাদ দেব। '0' হলে (আনলিমিটেড) বা '>1' হলে দেখাবো।
        if (coupon.usageLimit !== undefined && coupon.usageLimit !== null) {
            if (coupon.usageLimit === 1) return false; // শুধু ১ হলে বাদ (Single use)
        }

        // C. Expiry Date চেক
        if (coupon.expiryDate) {
          const expDate = new Date(coupon.expiryDate); 
          // ভ্যালিড ডেট এবং আজকের আগের তারিখ হলে বাদ
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