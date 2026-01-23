// src/app/api/cron/daily-check/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { sendNotificationToUser } from '@/lib/notification';
import { verifyCron } from '@/lib/auth-utils'; // ★ হেল্পার ইমপোর্ট

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // ১. সিকিউরিটি চেক
    if (!verifyCron(request)) {
        return NextResponse.json({ success: false, error: 'Unauthorized access' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');
    const usersCollection = db.collection('users');
    const ordersCollection = db.collection('orders');

    // আজকের তারিখ বের করা (MM-DD ফরম্যাটে)
    const today = new Date();
    const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
    const currentDay = today.getDate().toString().padStart(2, '0');
    const dateString = `-${currentMonth}-${currentDay}`; 

    // --- লজিক ১: জন্মদিন (Birthday) ---
    const birthdayUsers = await usersCollection.find({
        dob: { $regex: dateString + '$' } 
    }).toArray();

    for (const user of birthdayUsers) {
        await sendNotificationToUser(
            client,
            user._id.toString(),
            `Happy Birthday, ${user.name}! 🎂`,
            "Wishing you a delicious day! Treat yourself with a special meal from us.",
            "",
            '/menus'
        );
    }

    // --- লজিক ২: বিবাহবার্ষিকী (Anniversary) ---
    const anniversaryUsers = await usersCollection.find({
        anniversary: { $regex: dateString + '$' }
    }).toArray();

    for (const user of anniversaryUsers) {
        await sendNotificationToUser(
            client,
            user._id.toString(),
            `Happy Anniversary, ${user.name}! 🎉`,
            "Celebrate your special day with a grand feast. Order now!",
            "",
            '/menus'
        );
    }

    // --- লজিক ৩: ইনঅ্যাক্টিভ ইউজার (We Miss You) ---
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeOrders = await ordersCollection.distinct("userId", {
        Timestamp: { $gte: thirtyDaysAgo }
    });

    const inactiveUsers = await usersCollection.find({
        _id: { $nin: activeOrders },
        role: 'customer',
    }).limit(5).toArray();

    for (const user of inactiveUsers) {
        await sendNotificationToUser(
            client,
            user._id.toString(),
            "We Miss You! 🥺",
            "It's been a while since we served you. Come back and check out what's new!",
            "",
            '/menus'
        );
    }

    return NextResponse.json({ 
        success: true, 
        message: `Daily Check Done. Birthdays: ${birthdayUsers.length}, Anniversaries: ${anniversaryUsers.length}, Inactive alerts: ${inactiveUsers.length}` 
    });

  } catch (error: any) {
    console.error("Daily Check Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}