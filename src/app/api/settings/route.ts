// src/app/api/settings/route.ts

import { NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');
    
    const settings = await db.collection('settings').findOne({ type: 'general' });
    
    return NextResponse.json({ 
        success: true, 
        isStoreOpen: settings?.isStoreOpen ?? true,
        // ★ নতুন ফিল্ডগুলো পাঠানো হচ্ছে
        androidVersion: settings?.androidVersion || '1.0.0',
        apkUrl: settings?.apkUrl || '',
        forceUpdate: settings?.forceUpdate || false,
        
        // ওয়ালেট সেটিংস (যদি আগে থেকে থাকে)
        deliveryCharge: settings?.deliveryCharge || 40,
        freeDeliveryAbove: settings?.freeDeliveryAbove || 499,
        coinsPer100: settings?.coinsPer100 || 10,
        coinValue: settings?.coinValue || 1
    });
  } catch (error) {
    return NextResponse.json({ success: false, isStoreOpen: true });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json(); // বডি থেকে সব ফিল্ড নেওয়া হচ্ছে
    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');

    // ★ $set ব্যবহার করে পার্শিয়াল আপডেট করা হবে (যাতে শুধু নির্দিষ্ট ফিল্ড আপডেট হয়)
    await db.collection('settings').updateOne(
      { type: 'general' },
      { $set: { ...body, type: 'general' } }, 
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update' }, { status: 500 });
  }
}