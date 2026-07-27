// src/app/api/settings/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { pusherServer } from '@/lib/pusher'; // 🌟 Pusher import kora holo

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');
    
    const settings = await db.collection('settings').findOne({ type: 'general' });
    
    return NextResponse.json({ 
        success: true, 
        isStoreOpen: settings?.isStoreOpen ?? true,
        androidVersion: settings?.androidVersion || '1.0.0',
        apkUrl: settings?.apkUrl || '',
        forceUpdate: settings?.forceUpdate || false,
        deliveryCharge: settings?.deliveryCharge || 40,
        freeDeliveryAbove: settings?.freeDeliveryAbove || 499,
        coinsPer100: settings?.coinsPer100 || 10,
        coinValue: settings?.coinValue || 1
    });
  } catch (error) {
    return NextResponse.json({ success: false, isStoreOpen: true });
  }
}

import { verifyAdmin } from '@/lib/auth-utils'; // 🌟 Added Admin Verify

export async function POST(req: NextRequest) {
  try {
    if (!await verifyAdmin(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
    }

    const body = await req.json(); // Body theke shob field newa hocche
    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');

    // Database e partial update kora hocche
    await db.collection('settings').updateOne(
      { type: 'general' },
      { $set: { ...body, type: 'general' } }, 
      { upsert: true }
    );

    // 🌟 PUSHER TRIGGER: Jodi body te 'isStoreOpen' thake, tahole shob user ke janiye dao
    if (typeof body.isStoreOpen === 'boolean') {
        await pusherServer.trigger('store-updates', 'status-changed', {
            isOpen: body.isStoreOpen
        });
        console.log("Realtime store status broadcasted:", body.isStoreOpen);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update' }, { status: 500 });
  }
}