// src/app/api/admin/orders/status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { sendNotificationToUser } from '@/lib/notification';
import { finalizeDelivery } from '@/lib/order-service'; // ★ Shared Logic Import

const DB_NAME = 'BumbasKitchenDB';
const ORDERS_COLLECTION = 'orders';
const USERS_COLLECTION = 'users';
const TRANSACTIONS_COLLECTION = 'coinTransactions';
const COUPONS_COLLECTION = 'coupons'; 

const SUCCESS_STATUSES = ['Received', 'Delivered']; 

export async function PUT(request: NextRequest) {
  try {
    const { orderId, status } = await request.json();

    console.log(`[API] Updating Status: Order ${orderId} -> ${status}`);

    if (!orderId || !status) {
        return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const session = client.startSession();

    try {
        await session.withTransaction(async () => {
            
            const order = await db.collection(ORDERS_COLLECTION).findOne({ _id: new ObjectId(orderId) }, { session });
            
            if (!order) {
                throw new Error("Order not found");
            }

            let orderUpdate: any = { Status: status }; 
            
            // OTP Logic (For Received Status)
            let generatedOtp = null;
            if (status === 'Received') {
                generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
                orderUpdate.deliveryOtp = generatedOtp;
            }
            
            const couponCode = order.CouponCode;
            const orderCouponIncremented = order.couponUsageTracked === true;
            
            const isSuccessStatus = SUCCESS_STATUSES.includes(status);
            const isCancelled = status === 'Cancelled';
            
            // Coupon Logic
            if (couponCode) {
                if (isSuccessStatus && !orderCouponIncremented) {
                    await db.collection(COUPONS_COLLECTION).updateOne(
                        { code: couponCode },
                        { $inc: { timesUsed: 1 } },
                        { session }
                    );
                    orderUpdate.couponUsageTracked = true;
                } else if (isCancelled && orderCouponIncremented) {
                    await db.collection(COUPONS_COLLECTION).updateOne(
                        { code: couponCode },
                        { $inc: { timesUsed: -1 } },
                        { session }
                    );
                    orderUpdate.couponUsageTracked = false;
                }
            }
            
            // ১. স্ট্যাটাস আপডেট
            await db.collection(ORDERS_COLLECTION).updateOne(
                { _id: new ObjectId(orderId) },
                { $set: orderUpdate },
                { session }
            );

            let userId = null;
            if (order.userId) {
                userId = new ObjectId(order.userId);
            }

            // ২. লজিক: Delivered হলে Shared Function কল করা
            if (status === 'Delivered') {
                // ★★★ এটি এখন Coins এবং Delivery Notification হ্যান্ডেল করবে ★★★
                await finalizeDelivery(client, orderId, session);
            } 
            // ৩. লজিক: Refund (Cancelled)
            else if (status === 'Cancelled' && userId && order.CoinsRedeemed > 0 && !order.coinsRefunded) {
                // ... Refund Logic (Same as before) ...
                await db.collection(USERS_COLLECTION).updateOne(
                    { _id: userId },
                    { 
                        $inc: { "wallet.currentBalance": order.CoinsRedeemed },
                        $set: { "lastTransactionDate": new Date() }
                    },
                    { session }
                );

                await db.collection(TRANSACTIONS_COLLECTION).insertOne({
                    userId: userId,
                    type: 'refund',
                    amount: order.CoinsRedeemed,
                    description: `Refund for Cancelled Order #${order.OrderNumber}`,
                    createdAt: new Date()
                }, { session });

                await db.collection(ORDERS_COLLECTION).updateOne(
                    { _id: new ObjectId(orderId) },
                    { $set: { coinsRefunded: true } },
                    { session }
                );
                
                await sendNotificationToUser(
                    client, 
                    userId.toString(), 
                    "Coins Refunded", 
                    `${order.CoinsRedeemed} coins refunded.`, 
                    "", 
                    "/account/wallet"
                );
            }

            // ৪. লজিক: অন্যান্য স্ট্যাটাসের নোটিফিকেশন (Delivered বাদে)
            // কারণ Delivered হলে finalizeDelivery নিজেই নোটিফিকেশন পাঠাবে
            if (userId && status !== 'Delivered') {
                let notifBody = `Order #${order.OrderNumber} is now ${status}.`;
                
                if (status === 'Received' && generatedOtp) {
                    notifBody = `Your order is out for delivery! Share OTP: ${generatedOtp} with the delivery partner.`;
                }

                await sendNotificationToUser(
                    client, 
                    userId.toString(), 
                    `Order ${status} 📦`, 
                    notifBody, 
                    "", 
                    "/account/orders" 
                );
            }
        });

        return NextResponse.json({ success: true, message: `Status updated to ${status}` });

    } catch (error: any) {
        console.error("[API] Transaction Error:", error);
        throw error;
    } finally {
        await session.endSession();
    }

  } catch (error: any) {
    console.error("[API] Global Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}