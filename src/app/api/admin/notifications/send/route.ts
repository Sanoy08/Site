// src/app/api/admin/notifications/send/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { sendNotificationToAllUsers, sendNotificationToUser } from '@/lib/notification';
import { optimizeImageUrl } from '@/lib/imageUtils'; 
import { verifyAdmin } from '@/lib/auth-utils'; // ★★★ কুকি চেকার ইম্পোর্ট

export async function POST(request: NextRequest) {
  try {
    // ১. ★★★ সিকিউরিটি ফিক্স: কুকি থেকে অ্যাডমিন চেক
    if (!await verifyAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { title, message, link, userId, image } = await request.json(); 
    
    // 2. ইমেজ URL টি অপটিমাইজ (Proxy) করে নেওয়া হচ্ছে
    // এতে Cloudinary ডোমেইন বদলে images.bumbaskitchen.app হয়ে যাবে এবং ক্রেডিট বাঁচবে
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