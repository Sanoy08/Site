// src/app/api/admin/stats/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';

const DB_NAME = 'BumbasKitchenDB';
const ORDERS_COLLECTION = 'orders';
const USERS_COLLECTION = 'users';

export async function GET(request: NextRequest) {
  try {
    if (!await verifyAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const orderStats = await db.collection(ORDERS_COLLECTION).aggregate([
      { $match: { Status: 'Delivered' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$FinalPrice" }
        }
      }
    ]).toArray();

    const revenue = orderStats[0]?.totalRevenue || 0;
    const totalOrders = await db.collection(ORDERS_COLLECTION).countDocuments({ 
        Status: { $nin: ['Cancelled', 'Pending Verification'] } 
    });
    const totalCustomers = await db.collection(USERS_COLLECTION).countDocuments({ role: 'customer' });
    
    // Pending Orders (New orders waiting to be verified)
    const pendingOrders = await db.collection(ORDERS_COLLECTION).countDocuments({ 
      Status: 'Pending Verification'
    });

    // Calculate Today's Range in IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const nowIst = new Date(now.getTime() + istOffset);
    
    const startOfTodayUtc = new Date(Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth(), nowIst.getUTCDate(), 0, 0, 0, 0));
    const startOfToday = new Date(startOfTodayUtc.getTime() - istOffset);
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    const todayStats = await db.collection(ORDERS_COLLECTION).aggregate([
        { 
          $match: { 
            Status: 'Delivered',
            $or: [
              // PreferredDate আজকের দিনের এবং স্ট্যাটাস Delivered
              { PreferredDate: { $gte: startOfToday, $lte: endOfToday } },
              // Fallback: যদি কোনো অর্ডারে PreferredDate না থাকে, তবে Timestamp দেখবে
              {
                PreferredDate: { $exists: false },
                Timestamp: { $gte: startOfToday, $lte: endOfToday }
              }
            ]
          } 
        },
        { $group: { _id: null, todayRevenue: { $sum: "$FinalPrice" } } }
    ]).toArray();
    const todayRevenue = todayStats[0]?.todayRevenue || 0;

    const allOrders = await db.collection(ORDERS_COLLECTION)
        .find({ Status: 'Delivered' })
        .project({ Timestamp: 1, FinalPrice: 1, Items: 1, deliveredAt: 1, PreferredDate: 1 })
        .toArray();

    const monthlySales: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const itemSales: Record<string, number> = {};

    allOrders.forEach((order: any) => {
        // Monthly Sales Logic (prefer PreferredDate)
        const date = new Date(order.PreferredDate || order.deliveredAt || order.Timestamp);
        const monthName = months[date.getMonth()];
        if (!monthlySales[monthName]) monthlySales[monthName] = 0;
        monthlySales[monthName] += order.FinalPrice;

        // Top Selling Logic
        if (order.Items && Array.isArray(order.Items)) {
            order.Items.forEach((item: any) => {
                if (item.name) {
                    if (!itemSales[item.name]) itemSales[item.name] = 0;
                    itemSales[item.name] += (item.quantity || 1);
                }
            });
        }
    });

    // Format Data for charts
    const salesData = months.map(m => monthlySales[m] || 0);
    const topItems = Object.entries(itemSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, quantity]) => ({ name, sales: quantity }));

    // Planning Data for Dashboard: placedToday, deliveryToday, deliveryTomorrow (excluding Cancelled)
    const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const endOfTomorrow = new Date(startOfTomorrow.getTime() + 24 * 60 * 60 * 1000 - 1);

    const planningOrders = await db.collection(ORDERS_COLLECTION).find({
      Status: { $ne: 'Cancelled' },
      $or: [
        { PreferredDate: { $gte: startOfToday, $lte: endOfTomorrow } },
        { Timestamp: { $gte: startOfToday, $lte: endOfToday } }
      ]
    }).project({ _id: 1, OrderNumber: 1, Status: 1, PreferredDate: 1, Timestamp: 1 }).toArray();

    const isOrderActiveForDelivery = (status: string) => {
      const s = (status || '').toLowerCase().trim();
      return s !== 'cancelled' && s !== 'canceled' && s !== 'pending' && s !== 'pending verification' && s !== 'delivered';
    };

    const placedToday = planningOrders.filter((o: any) => o.Timestamp && new Date(o.Timestamp) >= startOfToday && new Date(o.Timestamp) <= endOfToday);
    const deliveryToday = planningOrders.filter((o: any) => isOrderActiveForDelivery(o.Status) && o.PreferredDate && new Date(o.PreferredDate) >= startOfToday && new Date(o.PreferredDate) <= endOfToday);
    const deliveryTomorrow = planningOrders.filter((o: any) => isOrderActiveForDelivery(o.Status) && o.PreferredDate && new Date(o.PreferredDate) >= startOfTomorrow && new Date(o.PreferredDate) <= endOfTomorrow);

    return NextResponse.json({
      success: true,
      stats: {
        revenue,
        totalOrders,
        totalCustomers,
        pendingOrders,
        todayRevenue
      },
      charts: {
        sales: salesData,
        topItems
      },
      planning: {
        placedToday,
        deliveryToday,
        deliveryTomorrow
      }
    });

  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
  }
}
