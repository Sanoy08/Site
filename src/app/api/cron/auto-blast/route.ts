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

    // ২. Time Slot ডিটেকশন (Kolkata Timezone)
    // Server time UTC te thake, tai IST te convert kora hocche
    const now = new Date();
    const options = { timeZone: "Asia/Kolkata", hour: 'numeric', hour12: false };
    // @ts-ignore
    const currentHour = parseInt(new Intl.DateTimeFormat('en-US', options).format(now));

    let targetSlot = 'anytime'; // Default

    if (currentHour >= 6 && currentHour < 11) {
        targetSlot = 'morning';
    } else if (currentHour >= 11 && currentHour < 16) {
        targetSlot = 'lunch';
    } else if (currentHour >= 16 && currentHour < 23) {
        targetSlot = 'dinner';
    } else {
        // rat 11tar por theke sokal 6ta porjonto kono auto notification jabe na
        return NextResponse.json({ success: true, message: 'Sleeping time (11PM - 6AM). No notifications sent.' });
    }

    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');

    // ৩. সঠিক টাইমের প্রিসেট খোঁজা (Example: 'lunch' OR 'anytime')
    const presets = await db.collection('notificationPresets').find({ 
        isActive: true,
        timeSlot: { $in: [targetSlot, 'anytime'] } // হয় নির্দিষ্ট টাইম, অথবা অল-টাইম মেসেজ
    }).toArray();

    if (presets.length === 0) {
        return NextResponse.json({ success: false, message: `No active presets found for ${targetSlot}.` });
    }

    // ৪. র‍্যান্ডম সিলেকশন
    const randomPreset = presets[Math.floor(Math.random() * presets.length)];

    // ৫. ব্রডকাস্ট পাঠানো
    await sendNotificationToAllUsers(
        client,
        randomPreset.title,
        randomPreset.message,
        randomPreset.image || "",
        randomPreset.link || "/"
    );

    // ৬. লগ রাখা
    await db.collection('notificationHistory').insertOne({
        title: randomPreset.title,
        message: randomPreset.message,
        image: randomPreset.image,
        sentAt: new Date(),
        type: 'AUTO_CRON',
        targetSlot: targetSlot, // কোন টাইমে পাঠানো হয়েছে
        sentCount: 'ALL'
    });

    return NextResponse.json({ 
        success: true, 
        message: `Sent '${randomPreset.title}' for slot: ${targetSlot}` 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}