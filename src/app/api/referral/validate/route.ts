// src/app/api/referral/validate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { validateReferralCode } from '@/lib/referral-service';

const DB_NAME = 'BumbasKitchenDB';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, phone } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Please enter a referral code.' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const validation = await validateReferralCode(db, code, phone);

    if (!validation.valid || !validation.referrer) {
      return NextResponse.json(
        { success: false, error: validation.error || 'Invalid referral code.' },
        { status: 400 }
      );
    }

    const fullName = validation.referrer.name || 'Friend';

    return NextResponse.json({
      success: true,
      valid: true,
      message: `Referral code applied! You were invited by ${fullName}.`,
      referrerName: fullName,
      code: validation.referrer.referralCode,
      referrer: {
        name: fullName,
        referralCode: validation.referrer.referralCode
      }
    });
  } catch (error: any) {
    console.error('Referral validate error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Validation failed' },
      { status: 500 }
    );
  }
}

