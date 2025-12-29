// src/app/api/cron/auto-blast/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { sendNotificationToAllUsers } from '@/lib/notification';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // ১. সিকিউরিটি চেক
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const queryKey = searchParams.get('key');
    const CRON_SECRET = process.env.CRON_SECRET;

    if (authHeader !== `Bearer ${CRON_SECRET}` && queryKey !== CRON_SECRET) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');

    // ২. অ্যাক্টিভ প্রিসেটগুলো লোড করা
    const presets = await db.collection('notificationPresets').find({ isActive: true }).toArray();

    if (presets.length === 0) {
        return NextResponse.json({ success: false, message: 'No active presets found.' });
    }

    // ৩. র‍্যান্ডমলি একটি মেসেজ বাছা (Magic Logic 🎲)
    const randomPreset = presets[Math.floor(Math.random() * presets.length)];

    // ৪. ব্রডকাস্ট পাঠানো
    await sendNotificationToAllUsers(
        client,
        randomPreset.title,
        randomPreset.message,
        randomPreset.image || "",
        randomPreset.link || "/"
    );

    // ৫. হিস্টোরিতে লগ সেভ করা (Admin Panel-এ দেখানোর জন্য)
    await db.collection('notificationHistory').insertOne({
        title: randomPreset.title,
        message: randomPreset.message,
        image: randomPreset.image,
        sentAt: new Date(),
        type: 'AUTO_CRON', // অটোমেটিক পাঠানো হয়েছে
        sentCount: 'ALL'
    });

    return NextResponse.json({ 
        success: true, 
        message: `Auto broadcast sent: "${randomPreset.title}"` 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}