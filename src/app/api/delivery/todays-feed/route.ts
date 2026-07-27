// src/app/api/delivery/todays-feed/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { getUser } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getUser(req);
    if (!currentUser) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

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