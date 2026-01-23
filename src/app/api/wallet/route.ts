// src/app/api/wallet/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUser } from '@/lib/auth-utils'; // ★★★ Fix: verifyUser -> getUser

const DB_NAME = 'BumbasKitchenDB';
const USERS_COLLECTION = 'users';
const TRANSACTIONS_COLLECTION = 'coinTransactions';

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

    // ২. প্যারালাল কুয়েরি: ইউজার ব্যালেন্স এবং ট্রানজেকশন হিস্ট্রি
    const [user, transactions] = await Promise.all([
        db.collection(USERS_COLLECTION).findOne(
            { _id: userId },
            { projection: { wallet: 1 } }
        ),
        db.collection(TRANSACTIONS_COLLECTION)
            .find({ userId: userId.toString() }) // অথবা new ObjectId(userId) যদি সেভাবে সেভ করে থাকেন
            .sort({ createdAt: -1 })
            .limit(20)
            .toArray()
    ]);

    // ৩. রেসপন্স পাঠানো
    return NextResponse.json({
        success: true,
        wallet: {
            balance: user?.wallet?.currentBalance || 0,
            tier: user?.wallet?.tier || 'Bronze',
            transactions: transactions || []
        }
    });

  } catch (error: any) {
    console.error("Wallet API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}