// src/lib/order-service.ts

import { MongoClient, ObjectId, ClientSession } from 'mongodb';
import { sendNotificationToUser } from '@/lib/notification';

const DB_NAME = 'BumbasKitchenDB';
const USERS_COLLECTION = 'users';
const TRANSACTIONS_COLLECTION = 'coinTransactions';
const ORDERS_COLLECTION = 'orders';

// এই ফাংশনটি Admin এবং Delivery Boy দুজনেই ব্যবহার করবে
export async function finalizeDelivery(
    client: MongoClient, 
    orderId: string, 
    session: ClientSession
) {
    const db = client.db(DB_NAME);
    // অর্ডার ডাটা আনছি (আপডেট হওয়ার পর কল হবে, তাই লেটেস্ট স্ট্যাটাস পাবে)
    const order = await db.collection(ORDERS_COLLECTION).findOne({ _id: new ObjectId(orderId) }, { session });

    if (!order) throw new Error("Order not found");

    const userId = order.userId ? new ObjectId(order.userId) : null;

    // ১. Coins Calculation & Wallet Update Logic
    if (userId && !order.coinsAwarded) {
        const user = await db.collection(USERS_COLLECTION).findOne({ _id: userId }, { session });
        
        if (user) {
            const orderTotal = parseFloat(order.FinalPrice) || 0;
            const currentTotalSpent = (user.totalSpent || 0) + orderTotal;
            
            // Tier Logic
            let newTier = "Bronze";
            let earnRate = 2; // Default Bronze

            if (currentTotalSpent >= 15000) { newTier = "Gold"; earnRate = 6; } 
            else if (currentTotalSpent >= 5000) { newTier = "Silver"; earnRate = 4; }

            // Coin Calculate
            const subtotal = parseFloat(order.Subtotal) || 0;
              const couponDiscount = parseFloat(order.CouponDiscount) || 0;
              const eligibleCoinAmount = Math.max(0, subtotal - couponDiscount);
              const coinsEarned = Math.floor((eligibleCoinAmount * earnRate) / 100);

            if (coinsEarned > 0) {
                // User Update
                await db.collection(USERS_COLLECTION).updateOne(
                    { _id: userId },
                    { 
                        $inc: { "wallet.currentBalance": coinsEarned, "totalSpent": orderTotal },
                        $set: { 
                            "wallet.tier": newTier,
                            "lastTransactionDate": new Date() 
                        }
                    },
                    { session }
                );

                // Transaction Log
                await db.collection(TRANSACTIONS_COLLECTION).insertOne({
                    userId: userId,
                    type: 'earn',
                    amount: coinsEarned,
                    description: `Earned from Order #${order.OrderNumber}`,
                    createdAt: new Date()
                }, { session });

                // Mark Order as Coins Awarded
                await db.collection(ORDERS_COLLECTION).updateOne(
                    { _id: new ObjectId(orderId) },
                    { $set: { coinsAwarded: true } },
                    { session }
                );

                // Notification: Coins Earned
                await sendNotificationToUser(
                    client, 
                    userId.toString(), 
                    "🎉 Coins Earned!", 
                    `You earned ${coinsEarned} coins from your recent order!`, 
                    "", 
                    "/account/wallet"
                );
            }
        }
    }

    // ২. Delivery Notification send করা (যদি ইউজার থাকে)
    if (userId) {
        await sendNotificationToUser(
            client, 
            userId.toString(), 
            "Order Delivered! 😋", 
            `Your Order #${order.OrderNumber} has been delivered successfully. Enjoy your meal!`, 
            "", 
            "/account/orders"
        );
    }
}
