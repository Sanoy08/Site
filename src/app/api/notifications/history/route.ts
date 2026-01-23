// src/app/api/notifications/history/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUser } from '@/lib/auth-utils'; // ★★★ কুকি চেকার

const DB_NAME = 'BumbasKitchenDB';
const NOTIFICATIONS_COLLECTION = 'notifications';

export async function GET(request: NextRequest) {
  try {
    // ১. কুকি থেকে ইউজার ভেরিফিকেশন
    const currentUser = await getUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = currentUser._id || currentUser.id;

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const notificationsCollection = db.collection(NOTIFICATIONS_COLLECTION);

    // ২. নোটিফিকেশন খোঁজা
    const notifications = await notificationsCollection.find({
        $or: [
            { userId: userId }, 
            { userId: new ObjectId(userId) }
        ]
    }).sort({ createdAt: -1 }).toArray();

    // ৩. আনরিড নোটিফিকেশন মার্ক করা
    const unreadIds = notifications.filter((n: any) => !n.isRead).map((n: any) => n._id);
    if (unreadIds.length > 0) {
        await notificationsCollection.updateMany(
            { _id: { $in: unreadIds } },
            { $set: { isRead: true } }
        );
    }

    return NextResponse.json({ success: true, notifications }, { status: 200 });

  } catch (error: any) {
    console.error("Notification History Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}