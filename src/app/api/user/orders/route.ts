// src/app/api/orders/user/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUser } from '@/lib/auth-utils'; // ★★★ কুকি চেকার

const DB_NAME = 'BumbasKitchenDB';
const ORDERS_COLLECTION = 'orders';

export async function GET(request: NextRequest) {
  try {
    // ১. কুকি থেকে ইউজার চেক
    const currentUser = await getUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = currentUser._id || currentUser.id;

    // ২. ডেটাবেস থেকে অর্ডার আনা
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    const orders = await db.collection(ORDERS_COLLECTION)
      .find({ userId: new ObjectId(userId) })
      .sort({ Timestamp: -1 })
      .toArray();

    return NextResponse.json({ success: true, orders }, { status: 200 });

  } catch (error: any) {
    console.error("Get User Orders Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}