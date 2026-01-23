// src/app/api/admin/finance/approve-deposit/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { sendNotificationToUser } from '@/lib/notification';
import { verifyAdmin } from '@/lib/auth-utils'; // ★ Import

export async function POST(req: NextRequest) {
    try {
        // ★ ১. সিকিউরিটি ফিক্স
        if (!await verifyAdmin(req)) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { requestId, action } = await req.json();
        
        const client = await clientPromise;
        const db = client.db('BumbasKitchenDB');
        const session = client.startSession();

        const request = await db.collection('depositRequests').findOne({ _id: new ObjectId(requestId) });
        if(!request) return NextResponse.json({success: false, error: "Request not found"});

        if(action === 'approve') {
            await session.withTransaction(async () => {
                await db.collection('depositRequests').updateOne(
                    { _id: new ObjectId(requestId) },
                    { $set: { status: 'approved', approvedAt: new Date() } },
                    { session }
                );

                await db.collection('orders').updateMany(
                    { _id: { $in: request.orderIds } },
                    { $set: { cashDeposited: true, depositRequestId: new ObjectId(requestId) } },
                    { session }
                );
            });

            await sendNotificationToUser(
                client, 
                request.deliveryBoyId.toString(), 
                "Deposit Approved! ✅", 
                `Your deposit of ₹${request.amount} has been accepted. Wallet cleared.`,
                "",
                "/delivery/profile"
            );

        } else {
            await db.collection('depositRequests').updateOne(
                { _id: new ObjectId(requestId) },
                { $set: { status: 'rejected' } }
            );
        }

        session.endSession();
        return NextResponse.json({ success: true });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}