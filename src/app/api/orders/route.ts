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
const OFFERS_COLLECTION = 'offers';
const COUPONS_COLLECTION = 'coupons';
const COIN_VALUE = 1; 

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json(); 
    // ★ coordinates destructured from request
    const { 
        items, couponCode, useCoins, address, deliveryAddress, 
        orderType, name, altPhone, mealTime, preferredDate, 
        instructions, deliveryFee, coordinates 
    } = orderData;

    const currentUser = await getUser(request);
    let userIdToSave: ObjectId | null = null;
    
    if (currentUser) {
        userIdToSave = new ObjectId(currentUser._id || currentUser.id);
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ success: false, error: 'Order must contain items.' }, { status: 400 });
    }

    console.log("=== CHECKOUT DEBUG: Incoming Items ===");
    console.log(JSON.stringify(items, null, 2));
    console.log("======================================");

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const session = client.startSession();

    let orderId = '';
    let finalAmountForLog = 0; 

    try {
        await session.withTransaction(async () => {
            const regularItems = items.filter((item: any) => !item.isSpecialOffer);
            const specialOfferItems = items.filter((item: any) => item.isSpecialOffer);

            const regularProductIds = regularItems.map((item: any) => new ObjectId(item.id));
            const specialOfferIds = specialOfferItems.map((item: any) => new ObjectId(item.id));

            const dbProducts = await db.collection(MENU_COLLECTION)
                .find({ _id: { $in: regularProductIds } }, { session })
                .toArray();

            const dbOffers = await db.collection(OFFERS_COLLECTION)
                .find({ _id: { $in: specialOfferIds } }, { session })
                .toArray();

            let calculatedSubtotal = 0;
            const validatedItems = [];

            // Validate regular items
            for (const item of regularItems) {
                const dbProduct = dbProducts.find(p => p._id.toString() === item.id);
                if (!dbProduct) throw new Error(`Product not found: ${item.name || item.id}`);

                const itemTotal = (dbProduct.Price || 0) * item.quantity;
                calculatedSubtotal += itemTotal;

                validatedItems.push({
                    ...item,
                    price: dbProduct.Price || 0,
                    name: dbProduct.Name,
                });
            }

            // Validate special offers
            for (const item of specialOfferItems) {
                const dbOffer = dbOffers.find(o => o._id.toString() === item.id);
                if (!dbOffer) throw new Error(`Special Offer not found: ${item.name || item.id}`);

                // Check cutoff time
                if (dbOffer.orderCutoffTime) {
                    const cutoffDate = new Date(dbOffer.orderCutoffTime);
                    if (new Date() > cutoffDate) {
                        throw new Error(`The order deadline for ${dbOffer.title || 'this special offer'} has passed.`);
                    }
                }

                const itemTotal = (dbOffer.price || 0) * item.quantity;
                calculatedSubtotal += itemTotal;

                validatedItems.push({
                    ...item,
                    price: dbOffer.price || 0,
                    name: dbOffer.title,
                });
            }

            let couponDiscount = 0;
            let appliedCouponCode = null;

            if (couponCode) {
                const coupon = await db.collection(COUPONS_COLLECTION).findOne({ code: couponCode.toUpperCase() }, { session });
                if (coupon) {
                   couponDiscount = coupon.discountType === 'percentage' ? (calculatedSubtotal * coupon.value) / 100 : coupon.value;
                   couponDiscount = Math.min(couponDiscount, calculatedSubtotal);
                   appliedCouponCode = coupon.code;
                   await db.collection(COUPONS_COLLECTION).updateOne({ _id: coupon._id }, { $inc: { timesUsed: 1 } }, { session });
                }
            }

            let coinsRedeemed = 0;
            let coinDiscount = 0;

            if (userIdToSave && useCoins) {
                const user = await db.collection(USERS_COLLECTION).findOne({ _id: userIdToSave }, { session });
                const userBalance = user?.wallet?.currentBalance || 0;
                coinsRedeemed = Math.min(userBalance, Math.floor((calculatedSubtotal * 0.5) / COIN_VALUE));
                coinDiscount = coinsRedeemed * COIN_VALUE;
                if (coinsRedeemed > 0) {
                    await db.collection(USERS_COLLECTION).updateOne({ _id: userIdToSave }, { $inc: { "wallet.currentBalance": -coinsRedeemed } }, { session });
                    orderId = `BK-${Date.now().toString().slice(-5)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
                    await db.collection(TRANSACTIONS_COLLECTION).insertOne({ userId: userIdToSave, type: 'redeem', amount: coinsRedeemed, description: `Redeemed for Order #${orderId}`, createdAt: new Date() }, { session });
                }
            }

            if (!orderId) orderId = `BK-${Date.now().toString().slice(-5)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

            const totalDiscount = couponDiscount + coinDiscount;
            const finalDeliveryCharge = orderType === 'delivery' ? (Number(deliveryFee) || 0) : 0;
            const finalPrice = Math.max(0, calculatedSubtotal + finalDeliveryCharge - totalDiscount);
            
            finalAmountForLog = finalPrice; 

            // ★ Saving Coordinates to DB
            const newOrder = {
                OrderNumber: orderId,
                userId: userIdToSave,
                Timestamp: new Date(),
                Name: name,
                Phone: altPhone,
                Address: address,
                DeliveryAddress: deliveryAddress || address,
                Coordinates: coordinates || null, // { lat: number, lng: number }
                OrderType: orderType || 'Delivery',
                MealTime: mealTime,
                PreferredDate: new Date(preferredDate),
                Instructions: instructions,
                
                Subtotal: calculatedSubtotal,
                DeliveryFee: finalDeliveryCharge,
                Discount: totalDiscount,
                CouponCode: appliedCouponCode,
                CouponDiscount: couponDiscount,
                CoinsRedeemed: coinsRedeemed,
                CoinDiscount: coinDiscount,
                FinalPrice: finalPrice, 
                
                Items: validatedItems, // Correctly pushed with image
                Status: "Pending Verification",
                coinsAwarded: false,
                coinsRefunded: false
            };

            await db.collection(ORDERS_COLLECTION).insertOne(newOrder, { session });
        });

        sendNotificationToAdmins(
            client,
            "New Order (Pending) ⚠️",
            `Order #${orderId} received. Amount: ₹${finalAmountForLog}`, 
            `https://admin.bumbaskitchen.app/orders?id=${orderId}`
        ).catch(err => console.error("Notification Error:", err));

        return NextResponse.json({ success: true, message: "Order placed successfully!", orderId: orderId, finalPrice: finalAmountForLog }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Failed to process order.' }, { status: 500 });
    } finally {
        await session.endSession();
    }

  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Server error processing order.' }, { status: 500 });
  }
}