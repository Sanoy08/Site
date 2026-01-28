// src/app/api/notifications/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { getUser } from '@/lib/auth-utils'; // ★ কুকি থেকে ইউজার বের করার ফাংশন
import { ObjectId } from 'mongodb';

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'subscriptions';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json(); // FCM Token
    
    if (!token) return NextResponse.json({ success: false, error: "Token missing" });

    // ১. কুকি থেকে ইউজার বের করা (Secure Way)
    const user = await getUser(request);
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // ২. ডাটাবেস আপডেট
    // যদি ইউজার লগইন থাকে, তাহলে userId সেভ হবে। না থাকলে null.
    const updateData: any = { 
        token: token,
        updatedAt: new Date(),
        platform: 'android' 
    };

    if (user) {
        updateData.userId = new ObjectId(user._id || user.id);
    }

    await db.collection(COLLECTION_NAME).updateOne(
      { token: token },
      { $set: updateData },
      { upsert: true }
    );

    return NextResponse.json({ success: true, message: "Subscription updated" });
  } catch (error: any) {
    console.error("Sub Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}