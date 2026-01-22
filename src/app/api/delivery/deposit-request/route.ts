// src/app/api/delivery/deposit-request/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { sendNotificationToAdmins } from '@/lib/notification';

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
}

// GET: Check Current Request Status
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if(!authHeader) return NextResponse.json({success: false}, {status: 401});
        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, JWT_SECRET);
        const deliveryBoyId = new ObjectId(decoded._id);

        const client = await clientPromise;
        const db = client.db('BumbasKitchenDB');

        // Check if any pending request exists
        const pendingRequest = await db.collection('depositRequests').findOne({
            deliveryBoyId: deliveryBoyId,
            status: 'pending'
        });

        return NextResponse.json({ success: true, pendingRequest });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}

// POST: Create New Request
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if(!authHeader) return NextResponse.json({success: false}, {status: 401});
        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, JWT_SECRET);
        const deliveryBoyId = new ObjectId(decoded._id);

        const client = await clientPromise;
        const db = client.db('BumbasKitchenDB');

        // 1. Check for existing pending request
        const existing = await db.collection('depositRequests').findOne({
            deliveryBoyId: deliveryBoyId,
            status: 'pending'
        });

        if (existing) {
            return NextResponse.json({ success: false, error: "You already have a pending request." });
        }

        // 2. Calculate Total Cash in Hand (Only COD + Delivered + Not Deposited)
        const orders = await db.collection('orders').find({
            deliveredBy: deliveryBoyId,
            PaymentMethod: 'COD',
            Status: 'Delivered',
            cashDeposited: { $ne: true }
        }).toArray();

        const totalAmount = orders.reduce((sum, order) => sum + (parseFloat(order.FinalPrice) || 0), 0);

        if (totalAmount <= 0) {
            return NextResponse.json({ success: false, error: "No cash to deposit." });
        }

        // 3. Create Deposit Request
        const requestDoc = {
            deliveryBoyId,
            deliveryBoyName: decoded.name, // Token থেকে নাম নেওয়া
            amount: totalAmount,
            orderIds: orders.map(o => o._id), // কোন কোন অর্ডারের টাকা
            status: 'pending', // pending -> approved -> rejected
            createdAt: new Date()
        };

        await db.collection('depositRequests').insertOne(requestDoc);

        /// 4. Notify Admin (এখানে URL চেঞ্জ করা হলো)
        await sendNotificationToAdmins(
            client, 
            "Cash Deposit Request 💰", 
            `${decoded.name} wants to deposit ₹${totalAmount}.`,
            // ★ আগে ছিল '/admin/reports', এখন পুরো লিঙ্ক:
            "https://admin.bumbaskitchen.app/reports" 
        );
        return NextResponse.json({ success: true, message: "Deposit request sent!" });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}