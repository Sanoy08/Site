// src/app/api/auth/phone/check-limit/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    // Fix: Prevent IP Spoofing
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    let extractedIp = realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : null) || request.ip || '127.0.0.1';
    const ip = typeof extractedIp === 'string' && extractedIp.length < 50 ? extractedIp : '127.0.0.1';
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');
    const otpLogsCollection = db.collection('otp_logs');

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // IP Limits Check
    const ipLogs = await otpLogsCollection.find({ ip, createdAt: { $gte: twentyFourHoursAgo } }).sort({createdAt: -1}).toArray();
    const ipAttempts = ipLogs.length;
    let ipLeft = Math.max(0, 5 - ipAttempts);
    let blockTime = null;
    let reason = '';

    if (ipAttempts >= 5) {
        // ৫ম অ্যাটেম্পটের সময় অনুযায়ী ২৪ ঘণ্টা পর ফুল রিসেট হবে
        blockTime = new Date(ipLogs[0].createdAt.getTime() + 24 * 60 * 60 * 1000);
        reason = 'Too many requests from this device.';
    }

    // Phone Limits Check
    let phoneLeft = 3;
    if (phone && phone.length === 10) {
        const phoneLogs = await otpLogsCollection.find({ phone, createdAt: { $gte: twentyFourHoursAgo } }).sort({createdAt: -1}).toArray();
        const phoneAttempts = phoneLogs.length;
        phoneLeft = Math.max(0, 3 - phoneAttempts);

        if (phoneAttempts >= 3 && (!blockTime || new Date(phoneLogs[0].createdAt.getTime() + 24 * 60 * 60 * 1000) > blockTime)) {
            // ৩য় অ্যাটেম্পটের সময় অনুযায়ী ২৪ ঘণ্টা পর ফুল রিসেট হবে
            blockTime = new Date(phoneLogs[0].createdAt.getTime() + 24 * 60 * 60 * 1000);
            reason = `Limit reached for +91 ${phone}.`;
        }
    }

    return NextResponse.json({
        success: true,
        ipLeft,
        phoneLeft,
        isBlocked: !!blockTime,
        resetTime: blockTime,
        reason
    });

  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}