// src/app/api/referral/my-status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUser } from '@/lib/auth-utils';
import {
  ensureUserReferralCode,
  MAX_REFERRALS_PER_USER,
  REFERRAL_REWARD_COINS,
  MIN_QUALIFYING_ORDER_AMOUNT,
  COIN_VALIDITY_DAYS
} from '@/lib/referral-service';

export const dynamic = 'force-dynamic';

const DB_NAME = 'BumbasKitchenDB';
const REFERRALS_COLLECTION = 'referrals';
const USERS_COLLECTION = 'users';

function maskPhone(phone?: string) {
  if (!phone) return 'User';
  const clean = phone.replace(/\D/g, '');
  if (clean.length >= 10) {
    const last10 = clean.slice(-10);
    return `+91 ${last10.slice(0, 2)}*** ***${last10.slice(-2)}`;
  }
  return phone;
}

export async function GET(request: NextRequest) {
  try {
    const userPayload: any = await getUser(request);
    if (!userPayload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = userPayload._id || userPayload.id;
    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // Get user document and ensure referralCode
    const user = await db.collection(USERS_COLLECTION).findOne(
      { _id: new ObjectId(userId) },
      { projection: { name: 1, referralCode: 1, referralCount: 1 } }
    );

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    let referralCode = user.referralCode;
    if (!referralCode) {
      referralCode = await ensureUserReferralCode(db, user._id);
    }

    // Fetch all referrals where this user is the referrer
    const referrals = await db
      .collection(REFERRALS_COLLECTION)
      .find({ referrerId: user._id })
      .sort({ createdAt: -1 })
      .toArray();

    // Fetch referee user documents to get their latest names & phones
    const refereeIds = referrals
      .map((r) => r.refereeId)
      .filter(Boolean)
      .map((id) => (typeof id === 'string' ? new ObjectId(id) : id));

    const refereeUsers = refereeIds.length > 0
      ? await db
          .collection(USERS_COLLECTION)
          .find({ _id: { $in: refereeIds } })
          .project({ _id: 1, name: 1, phone: 1 })
          .toArray()
      : [];

    const userMap = new Map<string, any>(
      refereeUsers.map((u) => [u._id.toString(), u])
    );

    // Map referral items for user friendly view
    const friends = referrals.map((ref) => {
      const refUser = ref.refereeId ? userMap.get(ref.refereeId.toString()) : null;
      const rawName = (refUser?.name || ref.refereeName || '').trim();
      const rawPhone = refUser?.phone || ref.refereePhone || '';

      const displayName = rawName && rawName !== 'New User' ? rawName : 'Friend';
      const phoneDisplay = maskPhone(rawPhone);

      return {
        id: ref._id.toString(),
        name: displayName,
        phoneMasked: phoneDisplay,
        status: ref.status, // 'pending' | 'rewarded' | 'under_review' | 'rejected' | 'reversed'
        createdAt: ref.createdAt,
        rewardCreditedAt: ref.rewardCredited?.creditedAt || null,
        coinsEarned: ref.status === 'rewarded' ? (ref.rewardCredited?.referrerCoins || REFERRAL_REWARD_COINS) : 0,
        qualifyingOrderAmount: ref.orderAmount || null
      };
    });

    const successfulCount = referrals.filter((r) => r.status === 'rewarded').length;
    const totalCoinsEarned = successfulCount * REFERRAL_REWARD_COINS;

    return NextResponse.json({
      success: true,
      referralCode,
      shareUrl: `https://www.bumbaskitchen.app/refer?code=${referralCode}`,
      referralCount: successfulCount,
      maxReferrals: MAX_REFERRALS_PER_USER,
      rewardPerReferral: REFERRAL_REWARD_COINS,
      minOrderAmount: MIN_QUALIFYING_ORDER_AMOUNT,
      coinValidityDays: COIN_VALIDITY_DAYS,
      totalCoinsEarned,
      canInviteMore: successfulCount < MAX_REFERRALS_PER_USER,
      friends
    });
  } catch (error: any) {
    console.error('Referral status API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

