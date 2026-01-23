// src/app/api/admin/users/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils'; // ★★★ কুকি চেকার ইম্পোর্ট

const DB_NAME = 'BumbasKitchenDB';
const USERS_COLLECTION = 'users';
const ORDERS_COLLECTION = 'orders';

export async function GET(request: NextRequest) {
  try {
    // ১. ★★★ সিকিউরিটি ফিক্স: কুকি থেকে অ্যাডমিন চেক
    if (!await verifyAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // Aggregation Pipeline: ইউজার এবং তাদের অর্ডার ডেটা একসাথে আনা
    const users = await db.collection(USERS_COLLECTION).aggregate([
      {
        $lookup: {
          from: ORDERS_COLLECTION,
          localField: '_id',
          foreignField: 'userId',
          as: 'orders'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          role: 1,
          phone: 1,
          createdAt: 1, // জয়েনিং ডেট
          // অর্ডারের তথ্য থেকে পরিসংখ্যান বের করা
          totalSpent: { $sum: "$orders.FinalPrice" },
          lastOrder: { $max: "$orders.Timestamp" },
          orderCount: { $size: "$orders" }
        }
      },
      { $sort: { createdAt: -1 } } // নতুন ইউজার আগে দেখাবে
    ]).toArray();

    // ফ্রন্টএন্ডের জন্য ডেটা ফরম্যাট করা
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      name: user.name || 'Unknown',
      email: user.email,
      role: user.role || 'customer',
      phone: user.phone || 'N/A',
      totalSpent: user.totalSpent || 0,
      lastOrder: user.lastOrder ? new Date(user.lastOrder).toISOString() : null,
      orderCount: user.orderCount || 0
    }));

    return NextResponse.json({ success: true, users: formattedUsers }, { status: 200 });

  } catch (error: any) {
    console.error("Admin Users API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}