// src/app/api/admin/referrals/action/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';
import { approveReferral, rejectReferral, reverseReferralReward } from '@/lib/referral-service';

export const dynamic = 'force-dynamic';

const DB_NAME = 'BumbasKitchenDB';

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { action, referralId, reason } = body;

    if (!referralId || typeof referralId !== 'string') {
      return NextResponse.json({ success: false, error: 'referralId is required.' }, { status: 400 });
    }

    if (!['approve', 'reject', 'reverse'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid action. Supported: approve, reject, reverse.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    let result;
    if (action === 'approve') {
      result = await approveReferral(client, db, referralId, reason);
    } else if (action === 'reject') {
      result = await rejectReferral(db, referralId, reason || 'Rejected by Admin');
    } else if (action === 'reverse') {
      result = await reverseReferralReward(db, referralId, reason || 'Reversed by Admin');
    }

    if (!result?.success) {
      return NextResponse.json({ success: false, error: result?.error || 'Action failed.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Referral successfully ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'reversed'}.`
    });
  } catch (error: any) {
    console.error('Admin referral action error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

