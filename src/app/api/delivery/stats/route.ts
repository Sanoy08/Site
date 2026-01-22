// src/app/api/delivery/stats/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
}

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if(!authHeader) return NextResponse.json({success: false}, {status: 401});
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const deliveryBoyId = new ObjectId(decoded._id);

    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');

    // Calculate Cash in Hand (Delivered by me AND Payment=COD AND Not Deposited)
    const orders = await db.collection('orders').find({
        deliveredBy: deliveryBoyId,
        PaymentMethod: 'COD',
        cashDeposited: { $ne: true }, // Not yet deposited
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