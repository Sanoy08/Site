// src/app/api/admin/users/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';

const DB_NAME = 'BumbasKitchenDB';
const USERS_COLLECTION = 'users';
const ORDERS_COLLECTION = 'orders';

export async function GET(request: NextRequest) {
  try {
    // 1. Security Check
    if (!await verifyAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // 2. Build Match Query (Search functionality)
    const matchQuery: any = {};
    if (search) {
      matchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // 3. Optimized Aggregation Pipeline
    // Strategy: Filter -> Sort -> Skip/Limit -> THEN Lookup Orders (Heavy operation last)
    const usersData = await db.collection(USERS_COLLECTION).aggregate([
      { $match: matchQuery },
      
      // Get Total Count (for pagination UI) and Data in one query using $facet
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $sort: { createdAt: -1 } }, // Newest users first
            { $skip: skip },
            { $limit: limit },
            
            // NOW perform the heavy lookup only for these few users
            {
              $lookup: {
                from: ORDERS_COLLECTION,
                localField: '_id',
                foreignField: 'userId', // Make sure your Order objects actually use 'userId' (ObjectId)
                as: 'orders'
              }
            },
            {
              $project: {
                name: 1,
                email: 1,
                role: 1,
                phone: 1,
                createdAt: 1,
                // Calculate stats only for this page
                totalSpent: { $sum: "$orders.FinalPrice" },
                lastOrder: { $max: "$orders.Timestamp" },
                orderCount: { $size: "$orders" }
              }
            }
          ]
        }
      }
    ]).toArray();

    const result = usersData[0];
    const totalUsers = result.metadata[0] ? result.metadata[0].total : 0;
    const users = result.data;

    // 4. Formatting
    const formattedUsers = users.map((user: any) => ({
      id: user._id.toString(),
      name: user.name || 'Unknown',
      email: user.email,
      role: user.role || 'customer',
      phone: user.phone || 'N/A',
      totalSpent: user.totalSpent || 0,
      lastOrder: user.lastOrder ? new Date(user.lastOrder).toISOString() : null,
      orderCount: user.orderCount || 0,
      createdAt: user.createdAt
    }));

    return NextResponse.json({ 
      success: true, 
      users: formattedUsers,
      pagination: {
        total: totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit)
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Admin Users API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}