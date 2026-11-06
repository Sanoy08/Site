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

    // Mask name for privacy (e.g., "Rahul S.")
    const rawName = validation.referrer.name || 'Friend';
    const nameParts = rawName.trim().split(' ');
    const maskedName =
      nameParts.length > 1
        ? `${nameParts[0]} ${nameParts[1].charAt(0)}.`
        : nameParts[0];

    return NextResponse.json({
      success: true,
      valid: true,
      message: `Referral code applied! You were invited by ${maskedName}.`,
      referrerName: maskedName,
      code: validation.referrer.referralCode,
      referrer: {
        name: maskedName,
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

