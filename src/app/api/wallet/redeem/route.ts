// src/app/api/wallet/redeem/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { sendNotificationToUser } from '@/lib/notification';
import { getUser } from '@/lib/auth-utils'; // ★ Fix: verifyUser -> getUser

const DB_NAME = 'BumbasKitchenDB';
const USERS_COLLECTION = 'users';
const TRANSACTIONS_COLLECTION = 'coinTransactions';
const COUPONS_COLLECTION = 'coupons';

const COIN_VALUE_MULTIPLIER = 1; 

// ★ হেল্পার ফাংশন: নরমাল টেক্সটকে বোল্ড ইউনিকোডে কনভার্ট করার জন্য
const toBoldUnicode = (text: string) => {
  const map: Record<string, string> = {
    '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵',
    'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
    'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
    '-': '-'
  };
  return text.split('').map(char => map[char] || char).join('');
};

export async function POST(request: NextRequest) {
  try {
    // 1. ★ ফিক্স: কুকি থেকে ইউজার ভেরিফাই করা (getUser ব্যবহার করে)
    const currentUser = await getUser(request);

    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = currentUser._id || currentUser.id;

    // 2. ইনপুট ভ্যালিডেশন
    const { coinsToRedeem } = await request.json();
    const redeemAmount = parseInt(coinsToRedeem);

    if (!redeemAmount || redeemAmount < 10) {
        return NextResponse.json({ success: false, error: 'Minimum 10 coins required to redeem.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const session = client.startSession();

    try {
        await session.withTransaction(async () => {
            
            // Atomic ব্যালেন্স চেক এবং কমানো (TOCTOU Race Condition Prevention)
            const walletUpdate = await db.collection(USERS_COLLECTION).updateOne(
                { _id: new ObjectId(userId), "wallet.currentBalance": { $gte: redeemAmount } },
                { $inc: { "wallet.currentBalance": -redeemAmount } },
                { session }
            );

            if (walletUpdate.modifiedCount === 0) {
                throw new Error('Insufficient coin balance or concurrent transaction error.');
            }

            const couponCode = `REDEEM-${Date.now().toString().slice(-6)}`;
            const discountValue = redeemAmount * COIN_VALUE_MULTIPLIER;

            // ★ বোল্ড কোড তৈরি
            const boldCode = toBoldUnicode(couponCode);

            // কুপন তৈরি
            await db.collection(COUPONS_COLLECTION).insertOne({
                code: couponCode,
                discountType: 'flat',
                value: discountValue,
                minOrder: 0,
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                isActive: true,
                isOneTime: true,
                userId: new ObjectId(userId),
                createdAt: new Date()
            }, { session });

            // ট্রানজেকশন লগ
            await db.collection(TRANSACTIONS_COLLECTION).insertOne({
                userId: new ObjectId(userId),
                type: 'redeem',
                amount: redeemAmount,
                description: `Redeemed for ₹${discountValue} coupon (${couponCode})`,
                createdAt: new Date()
            }, { session });

            // ★ নোটিফিকেশন পাঠানো
            await sendNotificationToUser(
                client,
                userId,
                "Coins Redeemed! 🎟️",
                `You successfully redeemed ${redeemAmount} coins for a ₹${discountValue} coupon. Code: ${boldCode}`,
                "", // Image URL
                "/account/coupons" // Link
            );
        });

        return NextResponse.json({ success: true, message: 'Coins redeemed successfully!' });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 400 });
    } finally {
        await session.endSession();
    }

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}