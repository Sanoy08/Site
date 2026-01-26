// src/app/api/orders/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { sendNotificationToAdmins } from '@/lib/notification';
import { getUser } from '@/lib/auth-utils';

const DB_NAME = 'BumbasKitchenDB';
const ORDERS_COLLECTION = 'orders';
const USERS_COLLECTION = 'users';
const TRANSACTIONS_COLLECTION = 'coinTransactions';
const MENU_COLLECTION = 'menuItems';
const COUPONS_COLLECTION = 'coupons';
const COIN_VALUE = 1; 

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json(); // বডি একবারই রিড করা হলো
    const { items, couponCode, useCoins, address, deliveryAddress, orderType, name, altPhone, mealTime, preferredDate, instructions } = orderData;

    // ১. অথেন্টিকেশন
    const currentUser = await getUser(request);
    let userIdToSave: ObjectId | null = null;
    
    if (currentUser) {
        userIdToSave = new ObjectId(currentUser._id || currentUser.id);
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ success: false, error: 'Order must contain items.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const session = client.startSession();

    // ★ নোটিফিকেশনের জন্য ভেরিয়েবলগুলো ট্রানজ্যাকশনের বাইরে ডিক্লেয়ার করা হলো
    let orderId = '';
    let finalAmountForLog = 0; 

    try {
        await session.withTransaction(async () => {
            // ২. সার্ভার-সাইড প্রাইস ক্যালকুলেশন (Database থেকে)
            const productIds = items.map((item: any) => new ObjectId(item.id));
            const dbProducts = await db.collection(MENU_COLLECTION)
                .find({ _id: { $in: productIds } }, { session })
                .toArray();

            let calculatedSubtotal = 0;
            const validatedItems = [];

            for (const item of items) {
                const dbProduct = dbProducts.find(p => p._id.toString() === item.id);
                
                if (!dbProduct) {
                    throw new Error(`Product not found: ${item.name} (ID: ${item.id})`);
                }

                // ডাটাবেস এর প্রাইস ব্যবহার করা হচ্ছে (ক্লায়েন্টের প্রাইস ইগনোর করা হলো)
                const itemTotal = (dbProduct.Price || 0) * item.quantity;
                calculatedSubtotal += itemTotal;

                validatedItems.push({
                    ...item,
                    price: dbProduct.Price || 0, // Enforce DB price
                    name: dbProduct.Name,        // Enforce DB name
                });
            }

            // ৩. কুপন ভ্যালিডেশন
            let couponDiscount = 0;
            let appliedCouponCode = null;

            if (couponCode) {
                const coupon = await db.collection(COUPONS_COLLECTION).findOne({ 
                    code: couponCode.toUpperCase() 
                }, { session });

                if (coupon) {
                    const now = new Date();
                    const expiryDate = coupon.expiryDate ? new Date(coupon.expiryDate) : null;
                    if (expiryDate) expiryDate.setHours(23, 59, 59, 999);

                    const isValid = 
                        coupon.isActive && 
                        (!expiryDate || expiryDate >= now) &&
                        (calculatedSubtotal >= (coupon.minOrder || 0));

                    const isLimitReached = coupon.usageLimit > 0 && (coupon.timesUsed || 0) >= coupon.usageLimit;
                    const isUserValid = !coupon.userId || (userIdToSave && coupon.userId.toString() === userIdToSave.toString());

                    if (isValid && !isLimitReached && isUserValid) {
                        if (coupon.discountType === 'percentage') {
                            couponDiscount = (calculatedSubtotal * coupon.value) / 100;
                        } else {
                            couponDiscount = coupon.value;
                        }
                        couponDiscount = Math.min(couponDiscount, calculatedSubtotal);
                        appliedCouponCode = coupon.code;

                        await db.collection(COUPONS_COLLECTION).updateOne(
                            { _id: coupon._id },
                            { $inc: { timesUsed: 1 } },
                            { session }
                        );
                    }
                }
            }

            // ৪. কয়েন রিডিমশন
            let coinsRedeemed = 0;
            let coinDiscount = 0;

            if (userIdToSave && useCoins) {
                const user = await db.collection(USERS_COLLECTION).findOne({ _id: userIdToSave }, { session });
                const userBalance = user?.wallet?.currentBalance || 0;
                const maxRedeemableAmount = calculatedSubtotal * 0.5; 
                const redeemableCoins = Math.floor(maxRedeemableAmount / COIN_VALUE);

                coinsRedeemed = Math.min(userBalance, redeemableCoins);
                coinDiscount = coinsRedeemed * COIN_VALUE;

                if (coinsRedeemed > 0) {
                    await db.collection(USERS_COLLECTION).updateOne(
                        { _id: userIdToSave },
                        { $inc: { "wallet.currentBalance": -coinsRedeemed } },
                        { session }
                    );

                    orderId = `BK-${Date.now().toString().slice(-5)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
                    
                    await db.collection(TRANSACTIONS_COLLECTION).insertOne({
                        userId: userIdToSave,
                        type: 'redeem',
                        amount: coinsRedeemed,
                        description: `Redeemed for Order #${orderId}`,
                        createdAt: new Date()
                    }, { session });
                }
            }

            if (!orderId) {
                orderId = `BK-${Date.now().toString().slice(-5)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            }

            // ৫. ফাইনাল ক্যালকুলেশন এবং সেভ
            const totalDiscount = couponDiscount + coinDiscount;
            const finalPrice = Math.max(0, calculatedSubtotal - totalDiscount);
            
            // ★ বাইরের ভেরিয়েবলে সঠিক মান রাখা হচ্ছে নোটিফিকেশনের জন্য
            finalAmountForLog = finalPrice; 

            const newOrder = {
                OrderNumber: orderId,
                userId: userIdToSave,
                Timestamp: new Date(),
                Name: name,
                Phone: altPhone,
                Address: address,
                DeliveryAddress: deliveryAddress || address,
                OrderType: orderType || 'Delivery',
                MealTime: mealTime,
                PreferredDate: new Date(preferredDate),
                Instructions: instructions,
                
                // Securely Calculated Values
                Subtotal: calculatedSubtotal,
                Discount: totalDiscount,
                CouponCode: appliedCouponCode,
                CouponDiscount: couponDiscount,
                CoinsRedeemed: coinsRedeemed,
                CoinDiscount: coinDiscount,
                FinalPrice: finalPrice, // ডাটাবেসে এই সঠিক প্রাইসটাই যাবে
                
                Items: validatedItems,
                Status: "Pending Verification",
                coinsAwarded: false,
                coinsRefunded: false
            };

            await db.collection(ORDERS_COLLECTION).insertOne(newOrder, { session });
        });

        // ৬. নোটিফিকেশন (সঠিক প্রাইস সহ)
        sendNotificationToAdmins(
            client,
            "New Order (Pending) ⚠️",
            // ★ ফিক্স: এখন আর request.json বা orderData.total নয়, বরং সার্ভারের হিসাব করা finalAmountForLog ব্যবহার হবে
            `Order #${orderId} received. Amount: ₹${finalAmountForLog}`, 
            `https://admin.bumbaskitchen.app/orders?id=${orderId}`
        ).catch(err => console.error("Notification Error:", err));

        return NextResponse.json({ 
            success: true, 
            message: "Order placed successfully!",
            orderId: orderId,
            finalPrice: finalAmountForLog
        }, { status: 201 });

    } catch (error: any) {
        console.error("Transaction Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to process order.' }, 
            { status: 500 }
        );
    } finally {
        await session.endSession();
    }

  } catch (error: any) {
    console.error("Order API Error:", error);
    return NextResponse.json(
      { success: false, error: 'Server error processing order.' },
      { status: 500 }
   );
  }
}