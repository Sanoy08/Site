// src/app/api/admin/finance/approve-deposit/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { sendNotificationToUser } from '@/lib/notification';
import { verifyAdmin } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
    try {
        // ১. সিকিউরিটি চেক
        if (!await verifyAdmin(req)) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { requestId, action } = await req.json();
        
        // ★ ২. ইনপুট ভ্যালিডেশন (ObjectId চেক)
        if (!requestId || !ObjectId.isValid(requestId)) {
             return NextResponse.json({ success: false, error: 'Invalid request ID format' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('BumbasKitchenDB');
        const session = client.startSession();

        try {
            let isSuccess = false;

            // ★ ৩. পুরো প্রসেসটিকে একটি ট্রানজেকশনের মধ্যে আনা হলো
            await session.withTransaction(async () => {
                const request = await db.collection('depositRequests').findOne(
                    { _id: new ObjectId(requestId) }, 
                    { session }
                );
                
                if(!request) {
                    throw new Error("NOT_FOUND");
                }

                if(action === 'approve') {
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

                    // নোটিফিকেশন ফেইল করলে যেন পুরো ট্রানজেকশন বাতিল না হয় তার জন্য আলাদা ক্যাচ ব্লক
                    try {
                        await sendNotificationToUser(
                            client, 
                            request.deliveryBoyId.toString(), 
                            "Deposit Approved! ✅", 
                            `Your deposit of ₹${request.amount} has been accepted. Wallet cleared.`,
                            "",
                            "/delivery/profile"
                        );
                    } catch (notifyError) {
                        console.error("Notification Error: ", notifyError);
                    }

                } else {
                    await db.collection('depositRequests').updateOne(
                        { _id: new ObjectId(requestId) },
                        { $set: { status: 'rejected' } },
                        { session } // ★ Reject এর ক্ষেত্রেও সেশন অ্যাড করা হলো
                    );
                }
                isSuccess = true;
            });

            return NextResponse.json({ success: isSuccess });

        } catch (txnError: any) {
            if(txnError.message === "NOT_FOUND") {
                 return NextResponse.json({success: false, error: "Request not found"}, { status: 404 });
            }
            throw txnError; // অন্যান্য ডাটাবেস এরর হলে মেইন ক্যাচ ব্লকে পাঠিয়ে দেবে
        } finally {
            await session.endSession();
        }

    } catch (e: any) {
        // সার্ভারে লগ প্রিন্ট হবে, কিন্তু ইউজার ডাটাবেসের ভেতরের খবর পাবে না
        console.error("Approve Deposit Error: ", e);
        // ★ ৪. Data Leakage ফিক্স
        return NextResponse.json({ success: false, error: 'Internal server error while processing deposit' }, { status: 500 });
    }
}