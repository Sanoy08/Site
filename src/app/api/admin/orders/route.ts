// src/app/api/admin/orders/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/lib/firebase-admin';
import { sendNotificationToUser } from '@/lib/notification';

const DB_NAME = 'BumbasKitchenDB';
const ORDERS_COLLECTION = 'orders';

// Helper to check Admin role via Firebase + MongoDB
async function isAdmin(request: NextRequest) {
  const decodedToken = await verifyAuth(request);
  if (!decodedToken) return false;

  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const user = await db.collection('users').findOne({
      $or: [{ uid: decodedToken.uid }, { email: decodedToken.email }]
    });
    return user?.role === 'admin';
  } catch {
    return false;
  }
}

// 1. Load all orders (GET)
export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Show latest orders first
    const orders = await db.collection(ORDERS_COLLECTION)
      .find({})
      .sort({ Timestamp: -1 }) 
      .toArray();

    return NextResponse.json({ success: true, orders }, { status: 200 });

  } catch (error: any) {
    console.error("Admin Orders API Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// 2. Update order status (PATCH)
export async function PATCH(request: NextRequest) {
  try {
    if (!await isAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, status } = await request.json();
    
    if (!orderId || !status) {
        return NextResponse.json({ success: false, error: 'Missing orderId or status' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Find order to get User ID
    const order = await db.collection(ORDERS_COLLECTION).findOne({ _id: new ObjectId(orderId) });
    
    if (!order) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Update status
    await db.collection(ORDERS_COLLECTION).updateOne(
        { _id: new ObjectId(orderId) },
        { $set: { Status: status } }
    );

    // ★★★ Send Notification to Customer ★★★
    if (order.userId) {
        let message = `Your order #${order.OrderNumber} status updated to: ${status}`;
        let title = "Order Update 📦";

        if (status === 'Out for Delivery') {
             message = `Your food is on the way! 🛵 Order #${order.OrderNumber}`;
             title = "Order On The Way!";
        } else if (status === 'Delivered') {
             message = `Enjoy your meal! 😋 Order #${order.OrderNumber} delivered.`;
             title = "Order Delivered";
        } else if (status === 'Cooking') {
             message = `We are preparing your food! 🍳 Order #${order.OrderNumber}`;
             title = "Cooking Started";
        }

        await sendNotificationToUser(
            client,
            order.userId.toString(),
            title,
            message,
            '/account/orders'
        );
    }

    return NextResponse.json({ success: true, message: 'Order status updated' }, { status: 200 });

  } catch (error: any) {
    console.error("Update Order Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
  }
}