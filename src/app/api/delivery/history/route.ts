// src/app/api/delivery/history/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUser } from '@/lib/auth-utils'; // ★★★ কুকি চেকার

export async function GET(req: NextRequest) {
    try {
        const currentUser = await getUser(req);
        if(!currentUser) return NextResponse.json({success: false}, {status: 401});
        
        const deliveryBoyId = new ObjectId(currentUser._id || currentUser.id);

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
        .sort({ deliveredAt: -1 }) 
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