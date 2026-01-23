// src/app/api/wallet/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUser } from '@/lib/auth-utils';

const DB_NAME = 'BumbasKitchenDB';
const USERS_COLLECTION = 'users';
const TRANSACTIONS_COLLECTION = 'coinTransactions';
const ORDERS_COLLECTION = 'orders';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // ১. কুকি থেকে ইউজার ভেরিফিকেশন
    const currentUser = await getUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = new ObjectId(currentUser._id || currentUser.id);
    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // ২. প্যারালাল কুয়েরি: ইউজার, ট্রানজেকশন এবং টোটাল খরচ
    const [user, transactions, orderStats] = await Promise.all([
        db.collection(USERS_COLLECTION).findOne(
            { _id: userId },
            { projection: { wallet: 1 } }
        ),
        db.collection(TRANSACTIONS_COLLECTION)
            .find({ userId: userId }) // ObjectId হিসেবে সার্চ করা ভালো
            .sort({ createdAt: -1 })
            .limit(20)
            .toArray(),
        // Total Spent ক্যালকুলেশন (শুধুমাত্র Delivered অর্ডার)
        db.collection(ORDERS_COLLECTION).aggregate([
            { 
                $match: { 
                    userId: userId, 
                    Status: 'Delivered' 
                } 
            },
            { 
                $group: { 
                    _id: null, 
                    totalSpent: { $sum: "$FinalPrice" } 
                } 
            }
        ]).toArray()
    ]);

    const totalSpent = orderStats.length > 0 ? orderStats[0].totalSpent : 0;

    // ৩. রেসপন্স পাঠানো
    return NextResponse.json({
        success: true,
        wallet: {
            balance: user?.wallet?.currentBalance || 0,
            tier: user?.wallet?.tier || 'Bronze',
            totalSpent: totalSpent, // নতুন যোগ করা হলো
            transactions: transactions || []
        }
    });

  } catch (error: any) {
    console.error("Wallet API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}