// src/app/api/delivery/verify-otp/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { clientPromise } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
    const { otp } = await req.json();
    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');

    // OTP ম্যাচিং এবং Status check
    const order = await db.collection('orders').findOne({ 
        deliveryOtp: otp,
        Status: "Received" 
    });

    if (!order) {
        return NextResponse.json({ success: false, error: "Invalid OTP or Order already delivered" });
    }

    return NextResponse.json({ success: true, order });
}