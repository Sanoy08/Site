// src/app/api/cron/coin-expiry/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { sendNotificationToUser } from '@/lib/notification';
import { verifyCron } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Security Check
    if (!verifyCron(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized access' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');
    const usersCollection = db.collection('users');
    const transactionsCollection = db.collection('coinTransactions');

    const now = new Date();

    // ==========================================
    // STEP 1: EXPIRE COINS (30 Days Validity Ended)
    // ==========================================
    // Find all batches where expiresAt has passed and remainingAmount > 0
    const expiredBatches = await transactionsCollection.find({
      type: { $in: ['earn', 'refund'] },
      remainingAmount: { $gt: 0 },
      expiresAt: { $lte: now }
    }).toArray();

    // Group by user
    const expiredByUser = new Map<string, { userId: any; totalExpired: number; batchIds: any[] }>();

    for (const batch of expiredBatches) {
      const uid = batch.userId.toString();
      const current = expiredByUser.get(uid) || { userId: batch.userId, totalExpired: 0, batchIds: [] };
      current.totalExpired += batch.remainingAmount;
      current.batchIds.push(batch._id);
      expiredByUser.set(uid, current);
    }

    let totalUsersExpired = 0;
    let totalCoinsExpired = 0;

    for (const [uid, data] of expiredByUser.entries()) {
      const { userId, totalExpired, batchIds } = data;
      if (totalExpired <= 0) continue;

      // Mark batch remainingAmount as 0
      await transactionsCollection.updateMany(
        { _id: { $in: batchIds } },
        { $set: { remainingAmount: 0 } }
      );

      // Check current user wallet balance to avoid dropping below 0
      const user = await usersCollection.findOne({ _id: userId }, { projection: { wallet: 1 } });
      const currentBalance = user?.wallet?.currentBalance || 0;
      const actualDeduct = Math.min(currentBalance, totalExpired);

      if (actualDeduct > 0) {
        await usersCollection.updateOne(
          { _id: userId },
          { $inc: { "wallet.currentBalance": -actualDeduct } }
        );

        // Record expiration transaction
        await transactionsCollection.insertOne({
          userId: userId,
          type: 'expire',
          amount: actualDeduct,
          description: `Expired ${actualDeduct} coins (30 days validity ended)`,
          createdAt: new Date()
        });

        // Send push notification to user
        await sendNotificationToUser(
          client,
          userId.toString(),
          "Coins Expired ⏳",
          `Your ${actualDeduct} coins have expired as their 30-day validity has ended.`,
          "",
          '/account/wallet'
        );

        totalUsersExpired++;
        totalCoinsExpired += actualDeduct;
      }
    }

    // ==========================================
    // STEP 2: PRE-EXPIRY WARNING (3 Days Notice)
    // ==========================================
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const expiringSoonBatches = await transactionsCollection.find({
      type: { $in: ['earn', 'refund'] },
      remainingAmount: { $gt: 0 },
      expiresAt: { $gt: now, $lte: threeDaysFromNow },
      expiryWarningSent: { $ne: true }
    }).toArray();

    const warningByUser = new Map<string, { userId: any; totalAmount: number; batchIds: any[] }>();

    for (const batch of expiringSoonBatches) {
      const uid = batch.userId.toString();
      const current = warningByUser.get(uid) || { userId: batch.userId, totalAmount: 0, batchIds: [] };
      current.totalAmount += batch.remainingAmount;
      current.batchIds.push(batch._id);
      warningByUser.set(uid, current);
    }

    let totalUsersWarned = 0;

    for (const [uid, data] of warningByUser.entries()) {
      const { userId, totalAmount, batchIds } = data;
      if (totalAmount <= 0) continue;

      // Mark warning sent so we don't repeat notification for these batches
      await transactionsCollection.updateMany(
        { _id: { $in: batchIds } },
        { $set: { expiryWarningSent: true } }
      );

      await sendNotificationToUser(
        client,
        userId.toString(),
        "Coins Expiring Soon! ⏳",
        `You have ${totalAmount} coins expiring within 3 days. Order now to use them!`,
        "",
        '/(shop)?scrollTo=explore'
      );

      totalUsersWarned++;
    }

    return NextResponse.json({
      success: true,
      message: `Executed 30-day Coin Expiry Job. Expired: ${totalCoinsExpired} coins across ${totalUsersExpired} users. Warned: ${totalUsersWarned} users.`
    });

  } catch (error: any) {
    console.error("Coin Expiry Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
