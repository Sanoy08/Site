// src/app/api/orders/resend-otp/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { sendNotificationToUser } from '@/lib/notification';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
}

export async function POST(req: NextRequest) {
    try {
        const { orderId } = await req.json();
        
        // Auth check
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return NextResponse.json({success: false}, {status: 401});
        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, JWT_SECRET);
        const userId = decoded._id;

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