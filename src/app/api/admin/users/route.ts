import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';

const DB_NAME = 'BumbasKitchenDB';
const USERS_COLLECTION = 'users';
const ORDERS_COLLECTION = 'orders';

export async function GET(request: NextRequest) {
  try {
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

    const matchQuery: any = {};
    if (search) {
      matchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const usersData = await db.collection(USERS_COLLECTION).aggregate([
      { $match: matchQuery },
      
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $sort: { createdAt: -1 } }, 
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: ORDERS_COLLECTION,
                localField: '_id',
                foreignField: 'userId', 
                as: 'allOrders'
              }
            },
            {
              $addFields: {
                deliveredOrders: {
                  $filter: {
                    input: "$allOrders",
                    as: "order",
                    cond: { $eq: ["$$order.Status", "Delivered"] }
                  }
                },
                cancelledOrders: {
                  $filter: {
                    input: "$allOrders",
                    as: "order",
                    cond: { $eq: ["$$order.Status", "Cancelled"] }
                  }
                }
              }
            },
            {
              $project: {
                name: 1,
                email: 1,
                role: 1,
                phone: 1,
                createdAt: 1,
                isVerified: 1,
                savedAddresses: 1,
                loginAddress: 1,
                totalSpent: 1, // Use native totalSpent from db
                lastOrder: { $max: "$deliveredOrders.Timestamp" },
                orderCount: { $size: "$deliveredOrders" },
                allOrdersCount: { $size: "$allOrders" },
                cancelledCount: { $size: "$cancelledOrders" }
              }
            }
          ]
        }
      }
    ]).toArray();

    const result = usersData[0];
    const totalUsers = result.metadata[0] ? result.metadata[0].total : 0;
    const users = result.data;

    const formattedUsers = users.map((user: any) => ({
      id: user._id.toString(),
      name: user.name || 'Unknown',
      email: user.email,
      role: user.role || 'customer',
      phone: user.phone || 'N/A',
      isVerified: user.isVerified === true,
      totalSpent: user.totalSpent || 0,
      lastOrder: user.lastOrder ? new Date(user.lastOrder).toISOString() : null,
      orderCount: user.orderCount || 0,
      allOrdersCount: user.allOrdersCount || 0,
      cancelledCount: user.cancelledCount || 0,
      savedAddresses: user.savedAddresses || [],
      loginAddress: user.loginAddress || null,
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
    });

  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

