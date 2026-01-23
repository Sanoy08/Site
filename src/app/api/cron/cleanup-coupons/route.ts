// src/app/api/cron/cleanup-coupons/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { verifyCron } from '@/lib/auth-utils'; // ★ হেল্পার ইমপোর্ট

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // ১. সিকিউরিটি চেক
    if (!verifyCron(request)) {
        return NextResponse.json({ success: false, error: 'Unauthorized access' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');
    const couponsCollection = db.collection('coupons');

    const now = new Date();

    // ২. ডিলিট করার শর্তসমূহ
    const result = await couponsCollection.deleteMany({
        $or: [
            // মেয়াদ শেষ
            { expiryDate: { $lt: now.toISOString().split('T')[0] } }, 
            // ইনঅ্যাক্টিভ
            { isActive: false },
            // ব্যবহারের লিমিট শেষ
            {
                $and: [
                    { usageLimit: { $exists: true, $ne: null, $gt: 0 } },
                    { $expr: { $gte: ["$timesUsed", "$usageLimit"] } }
                ]
            }
        ]
    });

    return NextResponse.json({ 
        success: true, 
        message: `Cleanup successful. Deleted ${result.deletedCount} coupons.` 
    });

  } catch (error: any) {
    console.error("Coupon Cleanup Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}