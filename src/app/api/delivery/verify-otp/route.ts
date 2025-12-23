import { NextResponse, NextRequest } from 'next/server';
import { clientPromise } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
    const { otp } = await req.json();
    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');

    // OTP দিয়ে অর্ডার খোঁজা
    const order = await db.collection('orders').findOne({ 
        deliveryOtp: otp,
        Status: "Received" // শুধুমাত্র Received গুলোই ডেলিভার করা যাবে
    });

    if (!order) {
        return NextResponse.json({ success: false, error: "Invalid OTP or Order not ready" });
    }

    return NextResponse.json({ success: true, order });
}