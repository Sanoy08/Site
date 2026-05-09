// src/app/api/orders/resend-otp/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { sendNotificationToUser } from '@/lib/notification';
import { getUser } from '@/lib/auth-utils'; // ★★★ কুকি চেকার

export async function POST(req: NextRequest) {
    try {
        const { orderId } = await req.json();
        
        // Auth check
        const currentUser = await getUser(req);
        if (!currentUser) return NextResponse.json({success: false}, {status: 401});
        
        const userId = currentUser._id || currentUser.id;

        const client = await clientPromise;
        const db = client.db('BumbasKitchenDB');

        const order = await db.collection('orders').findOne({ 
            _id: new ObjectId(orderId),
            userId: new ObjectId(userId),
            Status: "Received" // Only active deliveries
        });

        if (!order || !order.deliveryOtp) {
            return NextResponse.json({ success: false, error: "OTP not available" });
        }

        // Send Notification
        await sendNotificationToUser(
            client,
            userId,
            "Delivery OTP 🔐",
            `Here is your delivery OTP: ${order.deliveryOtp}`,
            "",
            "/account/orders"
        );

        return NextResponse.json({ success: true, message: "OTP sent to your notifications!" });

    } catch (e) {
        return NextResponse.json({ success: false, error: "Failed to resend" }, { status: 500 });
    }
}