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
    // 1. Verify User
    const currentUser = await getUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = new ObjectId(currentUser._id || currentUser.id);
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const now = new Date();

    // 2. Parallel Query: User, Transactions, Total Spent, and Next Expiring Coins
    const [user, transactions, orderStats, nextExpiringBatch] = await Promise.all([
        db.collection(USERS_COLLECTION).findOne(
            { _id: userId },
            { projection: { wallet: 1, totalSpent: 1 } }
        ),
        db.collection(TRANSACTIONS_COLLECTION)
            .find({ userId: userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .toArray(),
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
        ]).toArray(),
        // Nearest expiring coin batch for this user
        db.collection(TRANSACTIONS_COLLECTION)
            .find({
                userId: userId,
                type: { $in: ['earn', 'refund'] },
                remainingAmount: { $gt: 0 },
                expiresAt: { $gt: now }
            })
            .sort({ expiresAt: 1 })
            .limit(1)
            .toArray()
    ]);

    const totalSpent = orderStats.length > 0 ? orderStats[0].totalSpent : 0;
    const expiringInfo = nextExpiringBatch.length > 0 ? {
        amount: nextExpiringBatch[0].remainingAmount,
        expiresAt: nextExpiringBatch[0].expiresAt
    } : null;

    // 3. Return Wallet Details
    return NextResponse.json({
        success: true,
        wallet: {
            balance: user?.wallet?.currentBalance || 0,
            tier: user?.wallet?.tier || 'Bronze',
            totalSpent: user?.totalSpent || 0,
            expiringInfo,
            transactions: transactions || []
        }
    });

  } catch (error: any) {
    console.error("Wallet API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
