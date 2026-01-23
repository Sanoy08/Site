// src/app/api/delivery/stats/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUser } from '@/lib/auth-utils'; // ★★★ কুকি চেকার

export async function GET(req: NextRequest) {
    const currentUser = await getUser(req);
    if(!currentUser) return NextResponse.json({success: false}, {status: 401});
    
    const deliveryBoyId = new ObjectId(currentUser._id || currentUser.id);

    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');

    // Calculate Cash in Hand
    const orders = await db.collection('orders').find({
        deliveredBy: deliveryBoyId,
        PaymentMethod: 'COD',
        cashDeposited: { $ne: true }, 
        Status: 'Delivered'
    }).toArray();

    const cashInHand = orders.reduce((sum, order) => sum + (parseFloat(order.FinalPrice) || 0), 0);

    // Delivered Today
    const today = new Date();
    today.setHours(0,0,0,0);
    const deliveredTodayCount = await db.collection('orders').countDocuments({
        deliveredBy: deliveryBoyId,
        Status: 'Delivered',
        deliveredAt: { $gte: today }
    });

    return NextResponse.json({ 
        success: true, 
        stats: { cashInHand, deliveredToday: deliveredTodayCount } 
    });
}