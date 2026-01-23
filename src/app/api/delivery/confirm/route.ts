// src/app/api/delivery/confirm/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { finalizeDelivery } from '@/lib/order-service'; 
import { getUser } from '@/lib/auth-utils'; // ★★★ কুকি চেকার

export async function POST(req: NextRequest) {
    try {
        const { orderId } = await req.json();
        
        // Auth Check
        const currentUser = await getUser(req);
        if(!currentUser) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        
        const deliveryBoyId = new ObjectId(currentUser._id || currentUser.id);

        const client = await clientPromise;
        const db = client.db('BumbasKitchenDB');
        const session = client.startSession();

        try {
            await session.withTransaction(async () => {
                // ১. বেসিক ডেলিভারি ইনফো আপডেট
                await db.collection('orders').updateOne(
                    { _id: new ObjectId(orderId) },
                    { 
                        $set: { 
                            Status: "Delivered",
                            deliveredBy: deliveryBoyId,
                            deliveredAt: new Date(),
                            paymentCollected: true, 
                            cashDeposited: false
                        } 
                    },
                    { session }
                );

                // ২. এডমিনের মতো সব লজিক চালানো
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