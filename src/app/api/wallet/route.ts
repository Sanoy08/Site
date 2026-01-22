// src/app/api/wallet/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyUser } from '@/lib/auth-utils'; // ★ ফিক্স: কুকি চেক করার হেল্পার

const DB_NAME = 'BumbasKitchenDB';
const USERS_COLLECTION = 'users';
const TRANSACTIONS_COLLECTION = 'coinTransactions';

export async function GET(request: NextRequest) {
  try {
    // ★ ফিক্স: কুকি থেকে ইউজার ভেরিফাই করা হচ্ছে
    const decoded = await verifyUser(request);

    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = decoded._id;

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const userObjectId = new ObjectId(userId);

    // ইউজারের ওয়ালেট তথ্য আনা
    const user = await db.collection(USERS_COLLECTION).findOne(
        { _id: userObjectId },
        { projection: { wallet: 1, totalSpent: 1 } }
    );

    // ট্রানজেকশন হিস্ট্রি আনা
    const transactions = await db.collection(TRANSACTIONS_COLLECTION)
        .find({ userId: userObjectId })
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray();

    const formattedTransactions = transactions.map(txn => ({
        id: txn._id.toString(),
        type: txn.type,
        amount: txn.amount,
        description: txn.description,
        date: txn.createdAt
    }));

    return NextResponse.json({
        success: true,
        balance: user?.wallet?.currentBalance || 0,
        tier: user?.wallet?.tier || 'Bronze',
        totalSpent: user?.totalSpent || 0,
        transactions: formattedTransactions
    });

  } catch (error: any) {
    console.error("Wallet API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}