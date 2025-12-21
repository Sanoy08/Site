// src/app/api/coupons/list/route.ts

import { NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("BumbasKitchenDB");

    const currentDate = new Date();

    // কুয়েরি লজিক:
    // ১. isActive: true হতে হবে
    // ২. isOneTime: true হওয়া যাবে না (পার্সোনাল কুপন বাদ)
    // ৩. usageLimit: ১-এর বেশি হতে হবে অথবা আনলিমিটেড (null)
    // ৪. মেয়াদ থাকতে হবে
    
    const query = {
      isActive: true,
      isOneTime: { $ne: true }, // পার্সোনাল কুপন বাদ
      $or: [
        { usageLimit: { $gt: 1 } },  // ১-এর বেশি লিমিট
        { usageLimit: null },        // অথবা আনলিমিটেড
        { usageLimit: { $exists: false } }
      ],
      $and: [
        {
          $or: [
            { expiryDate: { $gte: currentDate } }, // মেয়াদ আছে
            { expiryDate: null } // অথবা মেয়াদ নেই (আজীবন)
          ]
        }
      ]
    };

    const coupons = await db.collection("coupons")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, coupons });

  } catch (error: any) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}