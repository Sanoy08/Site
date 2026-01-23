// src/app/api/orders/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { sendNotificationToAdmins } from '@/lib/notification';
import { getUser } from '@/lib/auth-utils'; // ★★★ কুকি চেকার

const DB_NAME = 'BumbasKitchenDB';
const ORDERS_COLLECTION = 'orders';
const USERS_COLLECTION = 'users';
const TRANSACTIONS_COLLECTION = 'coinTransactions';
const COIN_VALUE = 1; 

export async function POST(request: NextRequest) {
   try {
    const orderData = await request.json();

    // ১. অথেন্টিকেশন (অপশনাল - ইউজার লগইন আছে কি না দেখা)
     let userIdToSave: ObjectId | null = null;
     const currentUser = await getUser(request);
     
     if (currentUser) {
         userIdToSave = new ObjectId(currentUser._id || currentUser.id);
     }

     const client = await clientPromise;
     const db = client.db(DB_NAME);
     const session = client.startSession();

     const orderNumber = `BK-${Date.now().toString().slice(-5)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

     try {
         await session.withTransaction(async () => {

             let finalDiscount = 0;
             let coinsRedeemed = 0;
             let subtotal = parseFloat(orderData.subtotal);

            // ২. কয়েন রিডিমশন
            if (userIdToSave && orderData.useCoins) {
                const user = await db.collection(USERS_COLLECTION).findOne({ _id: userIdToSave }, { session });
                const userBalance = user?.wallet?.currentBalance || 0;

                const maxRedeemableAmount = subtotal * 0.5; 
                const redeemableCoins = Math.floor(maxRedeemableAmount / COIN_VALUE);

                coinsRedeemed = Math.min(userBalance, redeemableCoins);
                finalDiscount = coinsRedeemed * COIN_VALUE;

                if (coinsRedeemed > 0) {
                    // ওয়ালেট থেকে কয়েন কাটা
                    await db.collection(USERS_COLLECTION).updateOne(
                        { _id: userIdToSave },
                        { $inc: { "wallet.currentBalance": -coinsRedeemed } },
                        { session }
                    );

                    // ট্রানজেকশন হিস্ট্রি
                    await db.collection(TRANSACTIONS_COLLECTION).insertOne({
                        userId: userIdToSave,
                        type: 'redeem',
                        amount: coinsRedeemed,
                        description: `Redeemed for Order #${orderNumber}`,
                        createdAt: new Date()
                    }, { session });
                }
            }

            // ৩. ফাইনাল প্রাইস ক্যালকুলেশন
            // const finalPrice = subtotal - finalDiscount; 

            // ৪. অর্ডার সেভ করা
            const newOrder = {
                OrderNumber: orderNumber,
                userId: userIdToSave,
                Timestamp: new Date(),
                Name: orderData.name,
                Phone: orderData.altPhone,
                Address: orderData.address,
                DeliveryAddress: orderData.deliveryAddress || orderData.address,
                OrderType: orderData.orderType || 'Delivery',
                MealTime: orderData.mealTime,
                PreferredDate: new Date(orderData.preferredDate),
                Instructions: orderData.instructions,
                Subtotal: subtotal,
                Discount: orderData.discount || finalDiscount,
                CouponCode: orderData.couponCode,
                CoinsRedeemed: coinsRedeemed,
                FinalPrice: orderData.total,
                Items: orderData.items, 
                Status: "Pending Verification", 
                coinsAwarded: false, 
                coinsRefunded: false 
            };

            await db.collection(ORDERS_COLLECTION).insertOne(newOrder, { session });

            // ৫. নোটিফিকেশন
            sendNotificationToAdmins(
                client,
                "New Order (Pending) ⚠️",
                `Order #${orderNumber} needs verification.`,
                `https://admin.bumbaskitchen.app/orders?id=${orderNumber}`
            ).catch(console.error);

        });

        return NextResponse.json({ 
            success: true, 
            message: "Order placed successfully!",
            orderId: orderNumber
        }, { status: 201 });

    } catch (error: any) {
        throw error;
    } finally {
        await session.endSession();
    }

  } catch (error: any) {
    console.error("Order Save Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to place order.' },
      { status: 500 }
   );
  }
}