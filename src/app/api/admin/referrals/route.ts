// src/app/api/admin/referrals/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

const DB_NAME = 'BumbasKitchenDB';
const REFERRALS_COLLECTION = 'referrals';
const USERS_COLLECTION = 'users';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim();

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const referralsCollection = db.collection(REFERRALS_COLLECTION);

    // 1. Calculate KPI Metrics
    const [
      totalCount,
      successfulCount,
      pendingCount,
      underReviewCount,
      rejectedCount,
      reversedCount
    ] = await Promise.all([
      referralsCollection.countDocuments({}),
      referralsCollection.countDocuments({ status: 'rewarded' }),
      referralsCollection.countDocuments({ status: 'pending' }),
      referralsCollection.countDocuments({ status: 'under_review' }),
      referralsCollection.countDocuments({ status: 'rejected' }),
      referralsCollection.countDocuments({ status: 'reversed' })
    ]);

    // Calculate total coins credited
    const rewardedReferrals = await referralsCollection.find({ status: 'rewarded' }, { projection: { rewardCredited: 1 } }).toArray();
    const totalCoinsCredited = rewardedReferrals.reduce((sum, r) => {
      const refCoins = r.rewardCredited?.referrerCoins || 0;
      const refereeCoins = r.rewardCredited?.refereeCoins || 0;
      return sum + refCoins + refereeCoins;
    }, 0);

    // 2. Build Query Filters
    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { referralCode: searchRegex },
        { referrerPhone: searchRegex },
        { refereePhone: searchRegex },
        { referrerName: searchRegex },
        { refereeName: searchRegex }
      ];
    }

    // 3. Paginated Referral List
    const skip = (page - 1) * limit;
    const filteredTotal = await referralsCollection.countDocuments(query);
    const referrals = await referralsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Attach additional info if helpful
    const formatted = referrals.map(ref => ({
      _id: ref._id.toString(),
      referralCode: ref.referralCode,
      referrerId: ref.referrerId?.toString(),
      referrerPhone: ref.referrerPhone,
      referrerName: ref.referrerName || 'N/A',
      refereeId: ref.refereeId?.toString(),
      refereePhone: ref.refereePhone,
      refereeName: ref.refereeName || 'N/A',
      status: ref.status,
      riskFlags: ref.riskFlags || {},
      clientMetadata: ref.clientMetadata || {},
      qualifyingOrderId: ref.qualifyingOrderId?.toString() || null,
      orderAmount: ref.orderAmount || null,
      cumulativeSpent: ref.cumulativeSpent || ref.orderAmount || 0,
      ip: ref.ip || null,
      rewardCredited: ref.rewardCredited || null,
      rejectionReason: ref.rejectionReason || null,
      reversalReason: ref.reversalReason || null,
      createdAt: ref.createdAt,
      updatedAt: ref.updatedAt
    }));

    return NextResponse.json({
      success: true,
      stats: {
        total: totalCount,
        successful: successfulCount,
        pending: pendingCount,
        underReview: underReviewCount,
        rejected: rejectedCount,
        reversed: reversedCount,
        totalCoinsCredited
      },
      pagination: {
        page,
        limit,
        total: filteredTotal,
        totalPages: Math.ceil(filteredTotal / limit)
      },
      referrals: formatted
    });
  } catch (error: any) {
    console.error('Admin referrals fetch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

