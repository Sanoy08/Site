import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');
    
    // Filter: Exclude usageLimit === 1 (Single use private coupons)
    const query = {
        usageLimit: { $ne: 1 }
    };

    // Sort: Active ones first, then by date
    const coupons = await db.collection('coupons')
                            .find(query)
                            .sort({ isActive: -1, createdAt: -1 })
                            .toArray();

    return NextResponse.json({ success: true, coupons }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}