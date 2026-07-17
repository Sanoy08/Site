// src/app/api/orders/user/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUser } from '@/lib/auth-utils';

const DB_NAME = 'BumbasKitchenDB';
const ORDERS_COLLECTION = 'orders';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUser(request);
    
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = currentUser._id || currentUser.id;

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // টোটাল কয়টা অর্ডার আছে সেটা কাউন্ট করা হচ্ছে
    const totalOrders = await db.collection(ORDERS_COLLECTION).countDocuments({ userId: new ObjectId(userId) });
    const completedOrders = await db.collection(ORDERS_COLLECTION).countDocuments({ userId: new ObjectId(userId), Status: 'Delivered' });
    
    const orders = await db.collection(ORDERS_COLLECTION)
      .find({ userId: new ObjectId(userId) })
      .sort({ Timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({ 
      success: true, 
      orders, 
      totalOrders, 
      completedOrders 
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}
