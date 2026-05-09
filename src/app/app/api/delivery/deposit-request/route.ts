// src/app/api/delivery/deposit-request/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { sendNotificationToAdmins } from '@/lib/notification';
import { getUser } from '@/lib/auth-utils'; // ★★★ কুকি চেকার

// GET: Check Current Request Status
export async function GET(req: NextRequest) {
    try {
        const currentUser = await getUser(req);
        if(!currentUser) return NextResponse.json({success: false}, {status: 401});
        
        const deliveryBoyId = new ObjectId(currentUser._id || currentUser.id);

        const client = await clientPromise;
        const db = client.db('BumbasKitchenDB');

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
        const currentUser = await getUser(req);
        if(!currentUser) return NextResponse.json({success: false}, {status: 401});
        
        const deliveryBoyId = new ObjectId(currentUser._id || currentUser.id);

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

        // 2. Calculate Total Cash in Hand
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
            deliveryBoyName: currentUser.name,
            amount: totalAmount,
            orderIds: orders.map(o => o._id), 
            status: 'pending', 
            createdAt: new Date()
        };

        await db.collection('depositRequests').insertOne(requestDoc);

        // 4. Notify Admin
        await sendNotificationToAdmins(
            client, 
            "Cash Deposit Request 💰", 
            `${currentUser.name} wants to deposit ₹${totalAmount}.`,
            "https://admin.bumbaskitchen.app/reports" 
        );
        return NextResponse.json({ success: true, message: "Deposit request sent!" });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}