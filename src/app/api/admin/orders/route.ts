import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { sendNotificationToUser } from '@/lib/notification';
import { verifyAdmin } from '@/lib/auth-utils'; 

const DB_NAME = 'BumbasKitchenDB';
const ORDERS_COLLECTION = 'orders';

// Helper to calculate start and end of day in Asia/Kolkata (IST: UTC+5:30)
function getDayRangeIST(dateInput?: Date | string) {
    let istDateStr: string;
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        istDateStr = dateInput;
    } else {
        const d = dateInput ? new Date(dateInput) : new Date();
        istDateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    }
    const startOfDay = new Date(`${istDateStr}T00:00:00.000+05:30`);
    const endOfDay = new Date(`${istDateStr}T23:59:59.999+05:30`);
    return { startOfDay, endOfDay, dateStr: istDateStr };
}

export async function GET(request: NextRequest) {
  try {
    if (!await verifyAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    // Default limit 30 if not specified; allow up to 500 for legacy/dashboard calls
    const requestedLimit = url.searchParams.get('limit');
    const limit = requestedLimit ? Math.min(500, Math.max(1, parseInt(requestedLimit))) : 30;
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // Ensure lightweight compound indexes exist (idempotent, no-op if present)
    db.collection(ORDERS_COLLECTION).createIndex({ Timestamp: -1 }).catch(() => {});
    db.collection(ORDERS_COLLECTION).createIndex({ PreferredDate: -1 }).catch(() => {});
    db.collection(ORDERS_COLLECTION).createIndex({ Status: 1 }).catch(() => {});
    db.collection(ORDERS_COLLECTION).createIndex({ OrderNumber: 1 }).catch(() => {});
    db.collection(ORDERS_COLLECTION).createIndex({ Phone: 1 }).catch(() => {});

    const idParam = url.searchParams.get('id') || url.searchParams.get('orderId');
    const searchParam = url.searchParams.get('search');
    const dateFilterParam = url.searchParams.get('dateFilter') || url.searchParams.get('date_filter');
    const customDateParam = url.searchParams.get('customDate') || url.searchParams.get('date');
    const mealParam = url.searchParams.get('meal') || url.searchParams.get('mealTime');
    const statusParam = url.searchParams.get('status');
    const includeCancelled = url.searchParams.get('includeCancelled') === 'true';

    const conditions: any[] = [];

    if (idParam) {
        const cleanId = idParam.replace(/^#/, '').trim();
        let objectIdQuery: any = null;
        try {
            if (ObjectId.isValid(cleanId) && cleanId.length === 24) {
                objectIdQuery = new ObjectId(cleanId);
            }
        } catch (_) {}

        const cleanIdEscaped = cleanId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        conditions.push({
            $or: [
                { OrderNumber: cleanId },
                { OrderNumber: `#${cleanId}` },
                { OrderNumber: { $regex: new RegExp(`^#?${cleanIdEscaped}$`, 'i') } },
                ...(objectIdQuery ? [{ _id: objectIdQuery }] : [])
            ]
        });
    } else {
        // 1. Search Query
        if (searchParam && searchParam.trim()) {
            const cleanSearch = searchParam.trim();
            const cleanSearchEscaped = cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            conditions.push({
                $or: [
                    { OrderNumber: { $regex: new RegExp(cleanSearchEscaped, 'i') } },
                    { Name: { $regex: new RegExp(cleanSearchEscaped, 'i') } },
                    { Phone: { $regex: new RegExp(cleanSearchEscaped, 'i') } }
                ]
            });
        }

        // 2. Date Filter
        if (dateFilterParam) {
            const df = dateFilterParam.trim().toLowerCase();
            const now = new Date();

            if (df === 'placed today' || df === 'placed_today') {
                const { startOfDay, endOfDay, dateStr } = getDayRangeIST(now);
                conditions.push({
                    $or: [
                        { Timestamp: { $gte: startOfDay, $lte: endOfDay } },
                        { Timestamp: { $regex: new RegExp(`^${dateStr}`) } }
                    ]
                });
            } else if (df === 'delivery today' || df === 'delivery_today') {
                const { startOfDay, endOfDay, dateStr } = getDayRangeIST(now);
                conditions.push({
                    $or: [
                        { PreferredDate: { $gte: startOfDay, $lte: endOfDay } },
                        { PreferredDate: { $regex: new RegExp(`^${dateStr}`) } },
                        { 
                            $and: [
                                { $or: [{ PreferredDate: { $exists: false } }, { PreferredDate: null }, { PreferredDate: '' }] },
                                { $or: [{ Timestamp: { $gte: startOfDay, $lte: endOfDay } }, { Timestamp: { $regex: new RegExp(`^${dateStr}`) } }] }
                            ]
                        }
                    ]
                });
            } else if (df === 'delivery tomorrow' || df === 'delivery_tomorrow') {
                const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                const { startOfDay, endOfDay, dateStr } = getDayRangeIST(tomorrow);
                conditions.push({
                    $or: [
                        { PreferredDate: { $gte: startOfDay, $lte: endOfDay } },
                        { PreferredDate: { $regex: new RegExp(`^${dateStr}`) } },
                        { 
                            $and: [
                                { $or: [{ PreferredDate: { $exists: false } }, { PreferredDate: null }, { PreferredDate: '' }] },
                                { $or: [{ Timestamp: { $gte: startOfDay, $lte: endOfDay } }, { Timestamp: { $regex: new RegExp(`^${dateStr}`) } }] }
                            ]
                        }
                    ]
                });
            } else if ((df === 'custom' || customDateParam) && customDateParam) {
                const { startOfDay, endOfDay, dateStr } = getDayRangeIST(customDateParam);
                conditions.push({
                    $or: [
                        { PreferredDate: { $gte: startOfDay, $lte: endOfDay } },
                        { PreferredDate: { $regex: new RegExp(`^${dateStr}`) } },
                        { 
                            $and: [
                                { $or: [{ PreferredDate: { $exists: false } }, { PreferredDate: null }, { PreferredDate: '' }] },
                                { $or: [{ Timestamp: { $gte: startOfDay, $lte: endOfDay } }, { Timestamp: { $regex: new RegExp(`^${dateStr}`) } }] }
                            ]
                        }
                    ]
                });
            }
        }

        // 3. Meal Filter
        if (mealParam && mealParam.trim().toLowerCase() !== 'all') {
            const m = mealParam.trim();
            conditions.push({ MealTime: { $regex: new RegExp(`^${m}$`, 'i') } });
        }

        // 4. Status Filter
        if (statusParam && statusParam.trim().toLowerCase() !== 'all') {
            const s = statusParam.trim().toLowerCase();
            if (s === 'pending' || s === 'pending verification') {
                conditions.push({ Status: { $regex: /^pending( verification)?$/i } });
            } else {
                conditions.push({ Status: { $regex: new RegExp(`^${statusParam.trim()}$`, 'i') } });
            }
        }

        // 5. Exclude Cancelled (unless statusFilter is explicitly 'Cancelled' or includeCancelled is true)
        const isCancelledStatus = statusParam && statusParam.trim().toLowerCase() === 'cancelled';
        if (!includeCancelled && !isCancelledStatus) {
            conditions.push({ Status: { $not: { $regex: /^cancelled$/i } } });
        }
    }

    const query = conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : { $and: conditions }) : {};

    const totalOrders = await db.collection(ORDERS_COLLECTION).countDocuments(query);

    const orders = await db.collection(ORDERS_COLLECTION)
      .find(query)
      .sort({ Timestamp: -1 }) 
      .skip(skip)
      .limit(limit)
      .toArray();

    const userIds = orders.map((o: any) => o.userId).filter(Boolean).map((id: any) => {
        try { return new ObjectId(id); } catch(e) { return null; }
    }).filter(Boolean);
    
    let userMap = new Map();
    if (userIds.length > 0) {
        const users = await db.collection('users').find({ _id: { $in: userIds } }).project({ totalSpent: 1, wallet: 1 }).toArray();
        userMap = new Map(users.map((u: any) => [u._id.toString(), u]));
    }

    const enrichedOrders = orders.map((order: any) => {
        let earned = order.coinsEarned;
        let earnRate = 2;
        if (order.userId) {
            const user = userMap.get(order.userId.toString());
            if (user) {
                const spent = user.totalSpent || 0;
                if (spent >= 20000) earnRate = 6;
                else if (spent >= 5000) earnRate = 4;
            }
        }
        if (earned === undefined || earned === null) {
            const subtotal = parseFloat(order.Subtotal) || parseFloat(order.FinalPrice) || 0;
            const couponDiscount = parseFloat(order.CouponDiscount) || 0;
            const coinDiscount = parseFloat(order.CoinDiscount) || (parseFloat(order.CoinsRedeemed) || 0);
            const eligible = Math.max(0, subtotal - couponDiscount - coinDiscount);
            earned = Math.floor((eligible * earnRate) / 100);
        }
        return {
            ...order,
            earnRate,
            coinsToEarn: earned,
            coinsEarned: order.coinsAwarded ? (order.coinsEarned ?? earned) : undefined
        };
    });

    return NextResponse.json({ 
        success: true, 
        orders: enrichedOrders,
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
