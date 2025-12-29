// src/app/api/cron/auto-blast/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { sendNotificationToAllUsers } from '@/lib/notification';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const CRON_SECRET = process.env.CRON_SECRET;

    // (Optionally check query param too for easier testing)
    const { searchParams } = new URL(request.url);
    const queryKey = searchParams.get('key');

    if (authHeader !== `Bearer ${CRON_SECRET}` && queryKey !== CRON_SECRET) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // ★★★ TIME SLOT LOGIC (IST Timezone) ★★★
    const now = new Date();
    const options = { timeZone: "Asia/Kolkata", hour: 'numeric', hour12: false };
    // @ts-ignore
    const currentHour = parseInt(new Intl.DateTimeFormat('en-US', options).format(now));

    let targetSlot = '';

    // Logic for 6-hour intervals (00, 06, 12, 18)
    // We use ranges to be safe in case cron is 1-2 mins late
    if (currentHour >= 0 && currentHour < 6) {
        // Midnight (00:00 - 05:59) -> পরের দিনের লাঞ্চ প্রি-অর্ডার
        targetSlot = 'lunch-preorder';
    } 
    else if (currentHour >= 6 && currentHour < 12) {
        // Morning (06:00 - 11:59) -> আজকের লাঞ্চ
        targetSlot = 'lunch';
    } 
    else if (currentHour >= 12 && currentHour < 18) {
        // Noon (12:00 - 17:59) -> রাতের ডিনার প্রি-অর্ডার
        targetSlot = 'dinner-preorder';
    } 
    else if (currentHour >= 18 && currentHour <= 23) {
        // Evening (18:00 - 23:59) -> ডিনার অর্ডার
        targetSlot = 'dinner';
    }

    if (!targetSlot) {
        return NextResponse.json({ success: false, message: 'Could not determine time slot.' });
    }

    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');

    // নির্দিষ্ট স্লটের মেসেজ খোঁজা
    const presets = await db.collection('notificationPresets').find({ 
        isActive: true,
        timeSlot: targetSlot
    }).toArray();

    if (presets.length === 0) {
        return NextResponse.json({ success: false, message: `No active presets found for slot: ${targetSlot}` });
    }

    // র‍্যান্ডম সিলেকশন
    const randomPreset = presets[Math.floor(Math.random() * presets.length)];

    // ব্রডকাস্ট পাঠানো
    await sendNotificationToAllUsers(
        client,
        randomPreset.title,
        randomPreset.message,
        randomPreset.image || "",
        randomPreset.link || "/"
    );

    // লগ রাখা
    await db.collection('notificationHistory').insertOne({
        title: randomPreset.title,
        message: randomPreset.message,
        image: randomPreset.image,
        sentAt: new Date(),
        type: 'AUTO_CRON',
        targetSlot: targetSlot,
        sentCount: 'ALL'
    });

    return NextResponse.json({ 
        success: true, 
        message: `Sent '${randomPreset.title}' for slot: ${targetSlot} (Hour: ${currentHour})` 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}