// src/app/api/admin/notifications/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { sendNotificationToAllUsers, sendNotificationToUser } from '@/lib/notification';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

async function isAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  try {
    const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    return decoded.role === 'admin';
  } catch { return false; }
}

export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // ★ আপডেট: 'image' রিসিভ করা হচ্ছে
    const { title, message, link, userId, image } = await request.json(); 
    const client = await clientPromise;

    if (userId) {
        // Send to specific user (image পাস করা হলো)
        await sendNotificationToUser(client, userId, title, message, image, link);
    } else {
        // Broadcast to 'all_users' (image পাস করা হলো)
        await sendNotificationToAllUsers(client, title, message, image, link);
    }

    return NextResponse.json({ success: true, message: 'Notification queued' });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}