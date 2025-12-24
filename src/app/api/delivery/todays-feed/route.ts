// src/app/api/delivery/todays-feed/route.ts

import { NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');

    // Get today's orders (Status = Received only)
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await db.collection('orders').find({
        Status: "Received",
        // PreferredDate রেঞ্জ চেক (অপশনাল, যদি শুধু আজকের ডেলিভারি দেখাতে চান)
        // PreferredDate: { $gte: today, $lt: tomorrow } 
    }).sort({ Timestamp: -1 }).toArray();

    return NextResponse.json({ success: true, orders });
  } catch (e) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}