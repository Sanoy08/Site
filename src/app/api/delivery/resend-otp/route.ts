// src/app/api/delivery/resend-otp/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { sendNotificationToUser } from '@/lib/notification';

export async function POST(req: NextRequest) {
    try {
        const { orderId } = await req.json();
        
        const client = await clientPromise;
        const db = client.db('BumbasKitchenDB');

        // অর্ডার খুঁজে বের করা (Status Received হতে হবে)
        const order = await db.collection('orders').findOne({ 
            _id: new ObjectId(orderId),
            Status: "Received" 
        });

        if (!order || !order.deliveryOtp) {
            return NextResponse.json({ success: false, error: "OTP not available or Order not active" });
        }

        if (!order.userId) {
            return NextResponse.json({ success: false, error: "User not linked to order" });
        }

        // কাস্টমারকে নোটিফিকেশন পাঠানো
        await sendNotificationToUser(
            client,
            order.userId.toString(),
            "OTP Resent! 🔐",
            `Delivery Partner is waiting. Your OTP is: ${order.deliveryOtp}`,
            "",
            "/account/orders"
        );

        return NextResponse.json({ success: true, message: "OTP sent to customer!" });

    } catch (e) {
        console.error("Resend OTP Error:", e);
        return NextResponse.json({ success: false, error: "Failed to resend" }, { status: 500 });
    }
}