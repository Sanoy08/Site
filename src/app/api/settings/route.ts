// src/app/api/settings/route.ts

import { NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';

// সেটিংস ফেচ করা
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');
    
    // সেটিংস কালেকশন থেকে ডাটা আনো
    const settings = await db.collection('settings').findOne({ type: 'general' });
    
    // ডিফল্ট ভ্যালু (যদি ডাটাবেসে কিছু না থাকে)
    const isStoreOpen = settings ? settings.isStoreOpen : true; // ডিফল্ট: খোলা

    return NextResponse.json({ success: true, isStoreOpen });
  } catch (error) {
    return NextResponse.json({ success: false, isStoreOpen: true });
  }
}

// সেটিংস আপডেট করা (অ্যাডমিন)
export async function POST(req: Request) {
  try {
    const { isStoreOpen } = await req.json();
    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');

    await db.collection('settings').updateOne(
      { type: 'general' },
      { $set: { type: 'general', isStoreOpen } }, // স্ট্যাটাস আপডেট
      { upsert: true } // না থাকলে তৈরি করো
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update' }, { status: 500 });
  }
}