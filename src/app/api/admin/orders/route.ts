import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { sendNotificationToUser } from '@/lib/notification';
import { verifyAdmin } from '@/lib/auth-utils'; 

const DB_NAME = 'BumbasKitchenDB';
const ORDERS_COLLECTION = 'orders';

export async function GET(request: NextRequest) {
  try {
    if (!await verifyAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    const totalOrders = await db.collection(ORDERS_COLLECTION).countDocuments();

    const orders = await db.collection(ORDERS_COLLECTION)
      .find({})
      .sort({ Timestamp: -1 }) 
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({ 
        success: true, 
        orders,
        pagination: {
            page,
            limit,
            totalOrders,
            totalPages: Math.ceil(totalOrders / limit),
            hasMore: page < Math.ceil(totalOrders / limit)
        }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Admin Orders API Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!await verifyAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, status } = await request.json();
    
    if (!orderId || !status) {
        return NextResponse.json({ success: false, error: 'Missing orderId or status' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    const order = await db.collection(ORDERS_COLLECTION).findOne({ _id: new ObjectId(orderId) });
    
    if (!order) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    await db.collection(ORDERS_COLLECTION).updateOne(
        { _id: new ObjectId(orderId) },
        { $set: { Status: status } }
    );

    if (order.userId) {
        let message = `Your order #${order.OrderNumber} status updated to: ${status}`;
        let title = "Order Update 🔔";

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
            "", 
            '/account/orders' 
        );
    }

    return NextResponse.json({ success: true, message: 'Order status updated' }, { status: 200 });

  } catch (error: any) {
    console.error("Update Order Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
  }
}
