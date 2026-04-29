// src/app/api/notifications/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { getUser } from '@/lib/auth-utils'; // ★ কুকি থেকে ইউজার বের করার ফাংশন
import { ObjectId } from 'mongodb';

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'subscriptions';

export async function POST(request: NextRequest) {
  try {
    // ★ রিকোয়েস্ট থেকে appId বের করে নিচ্ছি
    const { token, appId } = await request.json(); 
    
    if (!token) return NextResponse.json({ success: false, error: "Token missing" });

    const user = await getUser(request);
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const updateData: any = { 
        token: token,
        updatedAt: new Date(),
        platform: 'android',
        appId: appId || 'com.bumbaskitchen.app' // ★ ডাটাবেসে appId সেভ করছি
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