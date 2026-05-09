// src/app/api/admin/customers-with-dates/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils'; // ★★★ কুকি চেকার ইম্পোর্ট

const DB_NAME = 'BumbasKitchenDB';
const USERS_COLLECTION = 'users';

export async function GET(request: NextRequest) {
  try {
    // ১. ★★★ সিকিউরিটি ফিক্স: কুকি থেকে অ্যাডমিন চেক
    if (!await verifyAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const users = await db.collection(USERS_COLLECTION).find({
        $or: [
            { dob: { $exists: true, $ne: "" } },
            { anniversary: { $exists: true, $ne: "" } }
        ]
    }).project({ name: 1, dob: 1, anniversary: 1, picture: 1 }).toArray();

    const today = new Date();
    const currentYear = today.getFullYear();
    let upcomingEvents: any[] = [];

    users.forEach(user => {
        const userId = user._id.toString();

        // 1. Birthday Process
        if (user.dob) {
            const date = new Date(user.dob);
            let nextDate = new Date(currentYear, date.getMonth(), date.getDate());
            if (nextDate < new Date(today.setHours(0,0,0,0))) {
                nextDate.setFullYear(currentYear + 1);
            }
            upcomingEvents.push({
                id: `${userId}-birthday`, // ★ FIX: ইউনিক আইডি (User ID + Type)
                userId: userId,
                name: user.name,
                originalDate: user.dob,
                nextDate: nextDate,
                type: 'birthday',
                daysLeft: Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            });
        }

        // 2. Anniversary Process
        if (user.anniversary) {
            const date = new Date(user.anniversary);
            let nextDate = new Date(currentYear, date.getMonth(), date.getDate());
            if (nextDate < new Date(today.setHours(0,0,0,0))) {
                nextDate.setFullYear(currentYear + 1);
            }
            upcomingEvents.push({
                id: `${userId}-anniversary`, // ★ FIX: ইউনিক আইডি (User ID + Type)
                userId: userId,
                name: user.name,
                originalDate: user.anniversary,
                nextDate: nextDate,
                type: 'anniversary',
                daysLeft: Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            });
        }
    });

    upcomingEvents.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());

    return NextResponse.json({ success: true, events: upcomingEvents });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}