import { NextResponse, NextRequest } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { sendNotificationToUser } from '@/lib/notification';

export async function POST(req: NextRequest) {
    try {
        const { requestId, action } = await req.json(); // action = 'approve' | 'reject'
        
        const client = await clientPromise;
        const db = client.db('BumbasKitchenDB');
        const session = client.startSession();

        const request = await db.collection('depositRequests').findOne({ _id: new ObjectId(requestId) });
        if(!request) return NextResponse.json({success: false, error: "Request not found"});

        if(action === 'approve') {
            await session.withTransaction(async () => {
                // 1. Mark request as approved
                await db.collection('depositRequests').updateOne(
                    { _id: new ObjectId(requestId) },
                    { $set: { status: 'approved', approvedAt: new Date() } },
                    { session }
                );

                // 2. Mark all linked orders as Deposited
                await db.collection('orders').updateMany(
                    { _id: { $in: request.orderIds } },
                    { $set: { cashDeposited: true, depositRequestId: new ObjectId(requestId) } },
                    { session }
                );
            });

            // 3. Notify Delivery Boy
            await sendNotificationToUser(
                client, 
                request.deliveryBoyId.toString(), 
                "Deposit Approved! ✅", 
                `Your deposit of ₹${request.amount} has been accepted. Wallet cleared.`,
                "",
                "/delivery/profile"
            );

        } else {
            // Reject logic
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