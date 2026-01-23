// src/app/api/cron/auto-blast/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { sendNotificationToAllUsers } from '@/lib/notification';
import { verifyCron } from '@/lib/auth-utils'; // ★ হেল্পার ইমপোর্ট

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // ১. সিকিউরিটি চেক
    if (!verifyCron(request)) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // TIME SLOT LOGIC (IST Timezone)
    const now = new Date();
    const options = { timeZone: "Asia/Kolkata", hour: 'numeric', hour12: false };
    // @ts-ignore
    const currentHour = parseInt(new Intl.DateTimeFormat('en-US', options).format(now));

    let targetSlot = '';

    if (currentHour >= 0 && currentHour < 6) {
        targetSlot = 'lunch-preorder';
    } 
    else if (currentHour >= 6 && currentHour < 12) {
        targetSlot = 'lunch';
    } 
    else if (currentHour >= 12 && currentHour < 18) {
        targetSlot = 'dinner-preorder';
    } 
    else if (currentHour >= 18 && currentHour <= 23) {
        targetSlot = 'dinner';
    }

    if (!targetSlot) {
        return NextResponse.json({ success: false, message: 'Could not determine time slot.' });
    }

    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');

    const presets = await db.collection('notificationPresets').find({ 
        isActive: true,
        timeSlot: targetSlot
    }).toArray();

    if (presets.length === 0) {
        return NextResponse.json({ success: false, message: `No active presets found for slot: ${targetSlot}` });
    }

    const randomPreset = presets[Math.floor(Math.random() * presets.length)];

    await sendNotificationToAllUsers(
        client,
        randomPreset.title,
        randomPreset.message,
        randomPreset.image || "",
        randomPreset.link || "/"
    );

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