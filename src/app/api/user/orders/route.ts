// src/app/api/user/orders/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/lib/firebase-admin';

const DB_NAME = 'BumbasKitchenDB';
const ORDERS_COLLECTION = 'orders';

export async function GET(request: NextRequest) {
  try {
    // 1. Verify Token
    const decodedToken = await verifyAuth(request);
    if (!decodedToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // 2. Get MongoDB User ID
    const user = await db.collection('users').findOne({
        $or: [{ uid: decodedToken.uid }, { email: decodedToken.email }]
    });

    if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const userId = user._id;

    // 3. Fetch Orders
    const orders = await db.collection(ORDERS_COLLECTION)
      .find({ userId: new ObjectId(userId) })
      .sort({ Timestamp: -1 }) // Newest first
      .toArray();

    return NextResponse.json({ success: true, orders }, { status: 200 });

  } catch (error: any) {
    console.error("Get User Orders Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}