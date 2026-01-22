// src/app/api/admin/notifications/send/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { sendNotificationToAllUsers, sendNotificationToUser } from '@/lib/notification';
import jwt from 'jsonwebtoken';
// 1. ইমেজ অপটিমাইজ ফাংশন ইমপোর্ট করুন
import { optimizeImageUrl } from '@/lib/imageUtils'; 

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
}

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

    const { title, message, link, userId, image } = await request.json(); 
    
    // 2. ইমেজ URL টি অপটিমাইজ (Proxy) করে নেওয়া হচ্ছে
    // এতে Cloudinary ডোমেইন বদলে images.bumbaskitchen.app হয়ে যাবে এবং ক্রেডিট বাঁচবে
    const optimizedImage = image ? optimizeImageUrl(image) : undefined;

    const client = await clientPromise;

    if (userId) {
        // অপটিমাইজড ইমেজ পাঠানো হচ্ছে
        await sendNotificationToUser(client, userId, title, message, optimizedImage, link);
    } else {
        // অপটিমাইজড ইমেজ পাঠানো হচ্ছে
        await sendNotificationToAllUsers(client, title, message, optimizedImage, link);
    }

    return NextResponse.json({ success: true, message: 'Notification queued' });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}