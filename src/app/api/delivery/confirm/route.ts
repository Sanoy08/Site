// src/app/api/delivery/confirm/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { finalizeDelivery } from '@/lib/order-service'; // ★ Shared Logic Import

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
}

export async function POST(req: NextRequest) {
    try {
        const { orderId } = await req.json();
        
        // Auth Check
        const authHeader = req.headers.get('authorization');
        if(!authHeader) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        
        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, JWT_SECRET);
        const deliveryBoyId = new ObjectId(decoded._id);

        const client = await clientPromise;
        const db = client.db('BumbasKitchenDB');
        const session = client.startSession();

        try {
            await session.withTransaction(async () => {
                // ১. বেসিক ডেলিভারি ইনফো আপডেট (Status, DeliveredBy, Time)
                await db.collection('orders').updateOne(
                    { _id: new ObjectId(orderId) },
                    { 
                        $set: { 
                            Status: "Delivered",
                            deliveredBy: deliveryBoyId,
                            deliveredAt: new Date(),
                            paymentCollected: true, // ক্যাশ নেওয়া হয়েছে ধরে নিচ্ছি
                            cashDeposited: false
                        } 
                    },
                    { session }
                );

                // ২. এডমিনের মতো সব লজিক চালানো (Coin, Wallet, Notifications)
                await finalizeDelivery(client, orderId, session);
            });
            
            return NextResponse.json({ success: true, message: "Delivery Confirmed & Rewards Processed" });

        } catch (e: any) {
            console.error("Transaction Error:", e);
            return NextResponse.json({ success: false, error: "Transaction Failed" });
        } finally {
            await session.endSession();
        }

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}