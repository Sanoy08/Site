// src/app/api/admin/orders/status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { sendNotificationToUser } from '@/lib/notification';
import { finalizeDelivery } from '@/lib/order-service';
import { verifyAdmin } from '@/lib/auth-utils';

const DB_NAME = 'BumbasKitchenDB';
const ORDERS_COLLECTION = 'orders';
const USERS_COLLECTION = 'users';
const TRANSACTIONS_COLLECTION = 'coinTransactions';
const COUPONS_COLLECTION = 'coupons'; 

// ★ পরিবেশ ভেরিয়েবল থেকে টপিক নেওয়া (OTP-র মতো)
const NTFY_TOPIC = process.env.NTFY_TOPIC;

const SUCCESS_STATUSES = ['Received', 'Delivered']; 

export async function PUT(request: NextRequest) {
  try {
    // Admin Check
    if (!await verifyAdmin(request)) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

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
            
            // OTP Generation for Delivery
            let generatedOtp = null;
            if (status === 'Received') {
                generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
                orderUpdate.deliveryOtp = generatedOtp;
            }
            
            // Coupon Logic
            const couponCode = order.CouponCode;
            const orderCouponIncremented = order.couponUsageTracked === true;
            const isSuccessStatus = SUCCESS_STATUSES.includes(status);
            const isCancelled = status === 'Cancelled';
            
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
            
            // Update Order
            await db.collection(ORDERS_COLLECTION).updateOne(
                { _id: new ObjectId(orderId) },
                { $set: orderUpdate },
                { session }
            );

            let userId = null;
            if (order.userId) {
                userId = new ObjectId(order.userId);
            }

            // Delivery & Refund Logic
            if (status === 'Delivered') {
                await finalizeDelivery(client, orderId, session);
            } 
            else if (status === 'Cancelled' && userId && order.CoinsRedeemed > 0 && !order.coinsRefunded) {
                // ... Refund logic same as before ...
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

            // ★★★ NOTIFICATION & SMS SECTION ★★★
            if (userId && status !== 'Delivered') {
                
                // ১. মেসেজ তৈরি করা
                let messageBody = `Order #${order.OrderNumber} is now ${status}.`;
                
                if (status === 'Received' && generatedOtp) {
                    messageBody = `Your order is out for delivery! Please share OTP: ${generatedOtp} with the rider.`;
                } else if (status === 'Cancelled') {
                    messageBody = `Your order #${order.OrderNumber} has been Cancelled.`;
                } else if (status === 'Cooking') {
                     messageBody = `Your order #${order.OrderNumber} is being prepared 🍳.`;
                }

                // ২. App Notification পাঠানো
                await sendNotificationToUser(
                    client, 
                    userId.toString(), 
                    `Order ${status} 📦`, 
                    messageBody, 
                    "", 
                    "/account/orders" 
                );

                // ★★★ ৩. SMS পাঠানো (OTP লজিক ব্যবহার করে) ★★★
                // অর্ডারে ফোন নম্বর আছে কিনা চেক করা
                const customerPhone = order.Phone || order.deliveryAddress?.phone;

                if (NTFY_TOPIC && customerPhone) {
                    // বি:দ্র: SMS-এ যাতে খুব বড় মেসেজ না যায়, তাই একটু ছোট করে লেখা
                    const smsContent = `Bumba's Kitchen: ${messageBody}`;

                    // এখানে await দিচ্ছি না যাতে API রেসপন্স ফাস্ট হয় (Fire & Forget)
                    fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
                        method: 'POST',
                        body: smsContent,
                        headers: {
                            'Title': customerPhone, // MacroDroid এই নম্বরে SMS পাঠাবে
                            'Priority': 'high',
                            'Tags': 'sms' // এই ট্যাগ দেখে MacroDroid বুঝবে এটা SMS
                        }
                    }).catch(err => console.error("SMS sending failed:", err));
                }
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