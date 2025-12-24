// src/app/api/delivery/history/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if(!authHeader) return NextResponse.json({success: false}, {status: 401});
        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, JWT_SECRET);
        const deliveryBoyId = new ObjectId(decoded._id);

        const client = await clientPromise;
        const db = client.db('BumbasKitchenDB');

        // গত ৩০ দিনের ডেলিভারি হিস্ট্রি
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const orders = await db.collection('orders').find({
            deliveredBy: deliveryBoyId,
            Status: "Delivered",
            deliveredAt: { $gte: thirtyDaysAgo }
        })
        .sort({ deliveredAt: -1 }) // একদম নতুন আগে
        .project({ 
            OrderNumber: 1, 
            Name: 1, 
            Address: 1, 
            FinalPrice: 1, 
            PaymentMethod: 1,
            deliveredAt: 1 
        })
        .toArray();

        return NextResponse.json({ success: true, orders });
    } catch (e) {
        return NextResponse.json({ success: false, error: "Failed to fetch history" }, { status: 500 });
    }
}