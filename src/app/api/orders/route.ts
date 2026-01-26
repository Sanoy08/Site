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
    const orderData = await request.json();
    const { items, couponCode, useCoins, address, deliveryAddress, orderType, name, altPhone, mealTime, preferredDate, instructions } = orderData;

    // 1. Authentication
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

    try {
        let orderId = '';

        await session.withTransaction(async () => {
            // ---------------------------------------------------------
            // 2. Server-Side Price Calculation (CRITICAL FIX)
            // ---------------------------------------------------------
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

                // Use the Price from Database, ignore client's price
                const itemTotal = (dbProduct.Price || 0) * item.quantity;
                calculatedSubtotal += itemTotal;

                validatedItems.push({
                    ...item,
                    price: dbProduct.Price || 0, // Enforce DB price
                    name: dbProduct.Name,        // Enforce DB name
                });
            }

            // ---------------------------------------------------------
            // 3. Coupon Validation & Application
            // ---------------------------------------------------------
            let couponDiscount = 0;
            let appliedCouponCode = null;

            if (couponCode) {
                const coupon = await db.collection(COUPONS_COLLECTION).findOne({ 
                    code: couponCode.toUpperCase() 
                }, { session });

                if (coupon) {
                    // Check Validity
                    const now = new Date();
                    const expiryDate = coupon.expiryDate ? new Date(coupon.expiryDate) : null;
                    if (expiryDate) expiryDate.setHours(23, 59, 59, 999);

                    const isValid = 
                        coupon.isActive && 
                        (!expiryDate || expiryDate >= now) &&
                        (calculatedSubtotal >= (coupon.minOrder || 0));

                    // Check Usage Limits
                    const isLimitReached = coupon.usageLimit > 0 && (coupon.timesUsed || 0) >= coupon.usageLimit;
                    
                    // Check User Ownership (if coupon is specific to user)
                    const isUserValid = !coupon.userId || (userIdToSave && coupon.userId.toString() === userIdToSave.toString());

                    if (isValid && !isLimitReached && isUserValid) {
                        if (coupon.discountType === 'percentage') {
                            couponDiscount = (calculatedSubtotal * coupon.value) / 100;
                        } else {
                            couponDiscount = coupon.value;
                        }
                        // Cap discount at subtotal
                        couponDiscount = Math.min(couponDiscount, calculatedSubtotal);
                        appliedCouponCode = coupon.code;

                        // Increment Coupon Usage
                        await db.collection(COUPONS_COLLECTION).updateOne(
                            { _id: coupon._id },
                            { $inc: { timesUsed: 1 } },
                            { session }
                        );
                    }
                }
            }

            // ---------------------------------------------------------
            // 4. Coin Redemption Logic
            // ---------------------------------------------------------
            let coinsRedeemed = 0;
            let coinDiscount = 0;

            if (userIdToSave && useCoins) {
                const user = await db.collection(USERS_COLLECTION).findOne({ _id: userIdToSave }, { session });
                const userBalance = user?.wallet?.currentBalance || 0;

                // Max redeemable is 50% of subtotal (Business Rule)
                const maxRedeemableAmount = calculatedSubtotal * 0.5; 
                const redeemableCoins = Math.floor(maxRedeemableAmount / COIN_VALUE);

                coinsRedeemed = Math.min(userBalance, redeemableCoins);
                coinDiscount = coinsRedeemed * COIN_VALUE;

                if (coinsRedeemed > 0) {
                    // Deduct Coins
                    await db.collection(USERS_COLLECTION).updateOne(
                        { _id: userIdToSave },
                        { $inc: { "wallet.currentBalance": -coinsRedeemed } },
                        { session }
                    );

                    // Log Transaction
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

            // ---------------------------------------------------------
            // 5. Final Calculation & Save
            // ---------------------------------------------------------
            const totalDiscount = couponDiscount + coinDiscount;
            const finalPrice = Math.max(0, calculatedSubtotal - totalDiscount);

            const newOrder = {
                OrderNumber: orderId,
                userId: userIdToSave,
                Timestamp: new Date(),
                Name: name,
                Phone: altPhone, // Assuming primary phone is in User obj, but saving contact info for order is good
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
                CouponDiscount: couponDiscount, // Keeping track specifically
                CoinsRedeemed: coinsRedeemed,
                CoinDiscount: coinDiscount,
                FinalPrice: finalPrice,
                
                Items: validatedItems,
                Status: "Pending Verification",
                coinsAwarded: false,
                coinsRefunded: false
            };

            await db.collection(ORDERS_COLLECTION).insertOne(newOrder, { session });
        });

        // 6. Notifications (After Transaction Commit)
        // Send notification to admin panel (non-blocking)
        sendNotificationToAdmins(
            client,
            "New Order (Pending) ⚠️",
            // FIX: Use orderData.total instead of request.json['total']
            `Order #${orderId} received. Amount: ₹${orderData.total || 'calculated'}`, 
            `https://admin.bumbaskitchen.app/orders?id=${orderId}`
        ).catch(err => console.error("Notification Error:", err));

        return NextResponse.json({ 
            success: true, 
            message: "Order placed successfully!",
            orderId: orderId,
            finalPrice: 0 // You might want to return the actual final price here
        }, { status: 201 });

    } catch (error: any) {
        console.error("Transaction Error:", error);
        // Transaction automatically aborts on error
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